class VideoController {
  /**
   * @param {HTMLVideoElement} video
   */
  constructor(video) {
    /** @type HTMLVideoElement */
    this.video = video;
    /** @type WebSocketClient */
    this.webSocket = null;
    this.remotePaused = true;
    this.remoteTime = 0;
  }

  makeButton() {
    const button = this.video.ownerDocument.createElement('img');
    button.src = browser.runtime.getURL("icon.svg");
    const wrap = this.video.ownerDocument.createElement('div');
    const buttonContainer = this.video.ownerDocument.createElement('div');
    wrap.append(button)
    wrap.classList.add('linkplay-wrap');
    buttonContainer.append(wrap);
    buttonContainer.classList.add('linkplay', 'linkplay-container');
    let timeout = null;
    for (const el of [buttonContainer, this.video]) {
      this.video.ownerDocument.addEventListener('mousemove', event => {
        const clientRect = this.video.getBoundingClientRect();
        if (clientRect.top < event.clientY && clientRect.left < event.clientY && clientRect.bottom > event.clientY && clientRect.right > event.clientX) {
          buttonContainer.classList.add('video-hover');
          if (timeout !== null)
            clearTimeout(timeout);
          timeout = setTimeout(() => buttonContainer.classList.remove('video-hover'), 2000);
        } else {
          if (timeout !== null)
            clearTimeout(timeout);
          buttonContainer.classList.remove('video-hover');
        }
      });
    }
    setInterval(() => {
      const clientRect = this.video.getBoundingClientRect();
      buttonContainer.style.top = `${clientRect.top + this.video.ownerDocument.documentElement.scrollTop}px`;
      buttonContainer.style.left = `${clientRect.left + this.video.ownerDocument.documentElement.scrollLeft}px`;
      buttonContainer.style.width = `${clientRect.width}px`;
      buttonContainer.style.height = `${clientRect.height}px`;
    }, 100);
    wrap.addEventListener('click', () => {
      browser.storage.sync.get("serverAddress").then(
        result => {
          if (!result.serverAddress) {
            result.serverAddress = 'linkplay.softwar3.com';
          }
          this.webSocket = new WebSocketClient(`wss://${result.serverAddress}:52795`, this, prompt('Group Name'));
          this.webSocket.webSocket.addEventListener('open', () => {
            this._attachLinkPlay();
          });
        },
      );
    });
    return buttonContainer;
  }

  attachLinkPlay() {
    console.log(this.video);
    this.video.ownerDocument.body.append(this.makeButton());
  }

  setTime(time) {
    console.log("set time HTML5");
    this.remoteTime = time;
    this.video.pause();
    this.video.currentTime = time;
  }

  play() {
    console.log("play HTML5");
    this.remotePaused = false;
    this.video.play();
  }

  pause() {
    console.log("pause HTML5");
    this.remotePaused = true;
    this.video.pause();
  }

  sendTime() {
    if (Math.abs(this.remoteTime - this.video.currentTime) > 0.1)
      this.webSocket.sendTime(this.video.currentTime);
  }

  sendPlay() {
    if (this.remotePaused)
      this.webSocket.sendPlay();
  }

  sendPause() {
    if (!this.remotePaused)
      this.webSocket.sendPause();
  }

  _attachLinkPlay() {
    console.log(`attach playback events`, this.video);
    this.video.addEventListener('pause', () => this.sendPause());
    this.video.addEventListener('play', () => this.sendPlay());
    this.video.addEventListener('seeked', () => this.sendTime());
  }

  /**
   * @param {HTMLVideoElement} node
   */
  static fromNode(node) {
    const window = node.ownerDocument.defaultView.wrappedJSObject;
    let video;
    if (typeof window.netflix !== 'undefined' && typeof window.netflix.appContext !== 'undefined') {
      console.log('make netflix video');
      video = new NetflixVideo(node);
    } else {
      console.log('make HTML5 video');
      video = new VideoController(node);
    }
    video.attachLinkPlay();
  }
}


class NetflixVideo extends VideoController {
  constructor(video) {
    super(video);
    const window = video.ownerDocument.defaultView.wrappedJSObject;
    const vp = window.netflix.appContext.state.playerApp.getAPI().videoPlayer;
    const id = vp.getAllPlayerSessionIds()[0];
    this.netflixPlayer = vp.getVideoPlayerBySessionId(id);
  }

  setTime(time) {
    console.log(`netflix set time`);
    this.remoteTime = time;
    this.netflixPlayer.seek(time * 1000);
  }

  play() {
    console.log(`netflix play`);
    this.remotePaused = false;
    this.netflixPlayer.play();
  }

  pause() {
    console.log(`netflix pause`);
    this.remotePaused = true;
    this.netflixPlayer.pause();
  }

  sendTime() {
    if (Math.abs(this.remoteTime - this.video.currentTime) > 0.1)
      this.webSocket.sendTime(this.netflixPlayer.getCurrentTime() / 1000);
  }
}
