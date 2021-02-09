/**
 * The controller of a specific HTML5 video.
 * 
 * If there are multiple HTML5 videos on the page, one instance of VideoController should be attached to each of them.
 */
class VideoController {
  /**
   * @param {HTMLVideoElement} video
   */
  constructor(video) {

    /**
     * The video that this controller handles and lays buttons over etc.
     * There should be only one {@link VideoController} per video.
     * @type HTMLVideoElement
     */
    this.video = video;
    this.video.addEventListener('pause', () => this.sendPause());
    this.video.addEventListener('play', () => this.sendPlay());
    this.video.addEventListener('seeked', () => this.sendTime());

    this.gui = new Gui(this);
    this.groupManager = new GroupManager();
    this.groupManager.onRemove.push(group => group.whenJoined === null ? ()=>{} : group.whenJoined.then(() => group.disjoin()));
    this.onJoinGroup = [];
    this.onDisjoinGroup = [];
  }

  /**
   * @see makeButton
   */
  attachLinkPlay() {
    this.video.ownerDocument.body.append(... this.gui.make());
  }

  /**
   * @param {Group} group
   * @returns {PromiseLike<void>}
   */
  joinGroup(group) {
    if (!this.groupManager.has(group)) {
      this.groupManager.add(group);
    }
    return browser.storage.sync.get("serverAddress").then(result => {
      if (!result.serverAddress) {
        result.serverAddress = 'linkplay.softwar3.com';
      }
      return group.join(`wss://${result.serverAddress}:52795`);
    }).then(() => {
      group.onSetTime.push(time => this.setTime(time));
      group.onPlay.push(() => this.play());
      group.onPause.push(() => this.pause());
      this.onJoinGroup.forEach(fn => fn(group));
      return group.whenDisjoined;
    }).then(() => {
      this.onDisjoinGroup.forEach(fn => fn(group));
    });
  }

  setTime(time) {
    this.video.pause();
    this.video.currentTime = time;
  }

  play() {
    this.video.play();
  }

  pause() {
    this.video.pause();
  }

  sendTime() {
    this.groupManager.groups.forEach(group => {
      if (Math.abs(group.collectiveTime - this.video.currentTime) > 0.1)
        group.sendTime(this.video.currentTime)
    });
  }

  sendPlay() {
    this.groupManager.groups.forEach(group => {
      if (group.collectivelyPaused)
        group.sendPlay()
    });
  }

  sendPause() {
    this.groupManager.groups.forEach(group => {
      if (!group.collectivelyPaused)
        group.sendPause()
    });
  }

  /**
   * @param {HTMLVideoElement} node
   */
  static fromNode(node) {
    const window = node.ownerDocument.defaultView.wrappedJSObject;
    let video;
    if (typeof window.netflix !== 'undefined' && typeof window.netflix.appContext !== 'undefined') {
      video = new NetflixVideo(node);
    } else {
      video = new VideoController(node);
    }
    video.attachLinkPlay();
  }
}


/**
 * Netflix breaks if we try to set the {@link HTMLVideoElement.currentTime} directly on the video.
 * Also the play and pause controls do not react to the raw video methods.
 * But we are lucky that Netflix provides an API for anyone to use and control these features.
 */
class NetflixVideo extends VideoController {
  constructor(video) {
    super(video);
    const window = video.ownerDocument.defaultView.wrappedJSObject;
    const vp = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
    const id = vp.getAllPlayerSessionIds()[0];
    this.netflixPlayer = vp.getVideoPlayerBySessionId(id);
  }

  setTime(time) {
    this.netflixPlayer.seek(time * 1000);
  }

  play() {
    this.netflixPlayer.play();
  }

  pause() {
    this.netflixPlayer.pause();
  }

  sendTime() {
    this.groupManager.groups.forEach(group => {
      if (Math.abs(group.collectiveTime - this.video.currentTime) > 0.1)
        group.sendTime(this.netflixPlayer.getCurrentTime() / 1000)
    });
  }
}
