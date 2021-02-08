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

    /**
     * The {@link WebSocketClient} that transmits signals from/to this video.
     * @type WebSocketClient
     */
    this.webSocket = null;

    /**
     * A boolean, indicating whether the remote videos are currently believed to be paused.
     * 
     * This is helpful so we don't send a PAUSE signal to videos that are paused anyway.
     * @type {boolean}
     */
    this.remotePaused = true;

    /**
     * The believed progress of the remote videos.
     * 
     * This is helpful so we don't send a TIME signal to videos that are synchronized anyway.
     * @type {number}
     */
    this.remoteTime = 0;
  }

  /**
   * Creates an HTML element that should be added the the end of the body tag to show the LinkPlay button.
   * The button will be there to control the video {@link VideoController.video}.
   * @returns {HTMLDivElement}
   */
  makeButton() {
    // Make the HTML structure
    const button = this.video.ownerDocument.createElement('img');
    button.src = browser.runtime.getURL("icon.svg");
    const wrap = this.video.ownerDocument.createElement('div');
    const buttonContainer = this.video.ownerDocument.createElement('div');
    wrap.append(button)
    wrap.classList.add('linkplay-wrap');
    buttonContainer.append(wrap);
    buttonContainer.classList.add('linkplay', 'linkplay-container');

    // Make it, so the CSS can hide the LinkPlay button, based on mouse movement.
    let timeout = null;
    for (const el of [buttonContainer, this.video]) {
      this.video.ownerDocument.addEventListener('mousemove', event => {
        const clientRect = this.video.getBoundingClientRect();
        if (clientRect.top < event.clientY && clientRect.left < event.clientX && clientRect.bottom > event.clientY && clientRect.right > event.clientX) {
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

    // Position the buttonContainer nicely
    setInterval(() => {
      const clientRect = this.video.getBoundingClientRect();
      buttonContainer.style.top = `${clientRect.top + this.video.ownerDocument.documentElement.scrollTop}px`;
      buttonContainer.style.left = `${clientRect.left + this.video.ownerDocument.documentElement.scrollLeft}px`;
      buttonContainer.style.width = `${clientRect.width}px`;
      buttonContainer.style.height = `${clientRect.height}px`;
    }, 100);

    // Make the connection happen when user clicks on LinkPlay button
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

  /**
   * @see makeButton
   */
  attachLinkPlay() {
    this.video.ownerDocument.body.append(this.makeButton());
  }

  setTime(time) {
    this.remoteTime = time;
    this.video.pause();
    this.video.currentTime = time;
  }

  play() {
    this.remotePaused = false;
    this.video.play();
  }

  pause() {
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
    this.remoteTime = time;
    this.netflixPlayer.seek(time * 1000);
  }

  play() {
    this.remotePaused = false;
    this.netflixPlayer.play();
  }

  pause() {
    this.remotePaused = true;
    this.netflixPlayer.pause();
  }

  sendTime() {
    if (Math.abs(this.remoteTime - this.video.currentTime) > 0.1)
      this.webSocket.sendTime(this.netflixPlayer.getCurrentTime() / 1000);
  }
}
