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
    this.video.addEventListener('seeked', () => {
      if (!this.ignoreSeek)
        this.sendJump();
    });
    this.video.addEventListener('timeupdate', () => {
      const now = new Date().getTime();
      if (this.lastSync < now - 200) {
        this.lastSync = now;
        this.sendSync();
      }
    });

    this.gui = new Gui(this);
    this.groupManager = new GroupManager();
    this.groupManager.onRemove.push(group => group.whenJoined === null ? ()=>{} : group.whenJoined.then(() => group.disjoin()));
    this.onJoinGroup = [];
    this.onDisjoinGroup = [];
    this.lastSync = 0;
    this.ignoreSeek = false;
    this.maxOutOfSync = 0.5;
  }

  /**
   * @see makeButton
   */
  attachLinkPlay() {
    this.groupManager.init();
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
    return group.join().then(() => {
      group.onJump.push(time => {
        this.ignoreSeek = true;
        this.jump(time);
        this.ignoreSeek = false;
      });
      group.onPlay.push(() => this.play());
      group.onPause.push(() => this.pause());
      group.onSync.push(time => this.sync(time));
      this.onJoinGroup.forEach(fn => fn(group));
      return group.whenDisjoined;
    }).then(() => {
      this.onDisjoinGroup.forEach(fn => fn(group));
    });
  }

  get time() {
    return this.video.currentTime;
  }

  set time(time) {
    this.video.currentTime = time;
  }

  jump(time) {
    this.time = time;
  }

  play() {
    this.video.play();
  }

  pause() {
    this.video.pause();
  }

  sync(time) {
    if (this.time > time + this.maxOutOfSync){
      this.ignoreSeek = true;
      this.time = time;
      this.ignoreSeek = false;
    }
  }

  sendJump() {
    this.groupManager.groups.forEach(group => {
      if (group.isJoined && Math.abs(group.collectiveTime - this.video.currentTime) > 0.1)
        group.sendJump(this.time);
    });
  }

  sendPlay() {
    this.groupManager.groups.forEach(group => {
      if (group.isJoined && group.collectivelyPaused) {
        this.sendJump(this.time);
        group.sendPlay();
      }
    });
  }

  sendPause() {
    this.groupManager.groups.forEach(group => {
      if (group.isJoined && !group.collectivelyPaused) {
        this.sendJump(this.time);
        group.sendPause();
      }
    });
  }

  sendSync() {
    this.groupManager.groups.forEach(group => {
      if (group.isJoined)
        group.sendSync(this.time);
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
    this.maxOutOfSync = 1.0; // Grant Netflix more out of sync room, so rewinds are less often
  }

  get time() {
    return this.netflixPlayer.getCurrentTime() / 1000;
  }

  set time(time) {
    this.netflixPlayer.seek(time * 1000);
  }

  play() {
    this.netflixPlayer.play();
  }

  pause() {
    this.netflixPlayer.pause();
  }

  /**
   * Reimplemented for Netflix to remove jumps because Netflix jumps very often cause rewinds by several seconds
   */
  sendPlay() {
    this.groupManager.groups.forEach(group => {
      if (group.isJoined && group.collectivelyPaused) {
        group.sendPlay();
      }
    });
  }

  /**
   * Reimplemented for Netflix to remove jumps because Netflix jumps very often cause rewinds by several seconds
   */
  sendPause() {
    this.groupManager.groups.forEach(group => {
      if (group.isJoined && !group.collectivelyPaused) {
        group.sendPause();
      }
    });
  }
}
