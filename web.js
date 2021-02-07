let cssIsInjected = false;

class WebSocketClient {
  /**
   * @param {string} url
   * @param {Video} video
   * @param {string} group
   */
  constructor(url, video, group) {
    console.log('web socket client starting...');
    try {
      /** @type {WebSocket} */
      this.webSocket = new WebSocket(url);
    } catch (e) {
      console.error(e);
    }
    console.log('web socket client started');
    console.log(`connect to ${group}`);
    this.webSocket.addEventListener('message', event => this.handleMessage(event.data));
    this.webSocket.addEventListener('open', () => this.webSocket.send(group));
    this.video = video;
    console.log(`send ${group}`);
  }

  /**
   * @param {string} data
   */
  handleMessage(data) {
    if (data.startsWith('TIME ')) {
      this.video.setTime(parseFloat(data.substr(5)));
    }
    if (data === 'PLAY') {
      this.video.play();
    }
    if (data === 'PAUSE') {
      this.video.pause();
    }
  }

  sendPause() {
    console.log(`send PAUSE`);
    this.webSocket.send('PAUSE');
  }

  sendPlay() {
    console.log(`send PLAY`);
    this.webSocket.send('PLAY');
  }

  sendTime(time) {
    console.log(`send TIME ${time}`);
    this.webSocket.send(`TIME ${time}`);
  }
}


class Video {
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
    const button = document.createElement('img');
    button.src = browser.runtime.getURL("icon.svg");
    const buttonContainer = document.createElement('div');
    buttonContainer.append(button);
    buttonContainer.classList.add('linkplay', 'linkplay-attach');
    let timeout = null;
    for (const el of [buttonContainer, this.video]) {
      el.addEventListener('mousemove', () => {
        buttonContainer.classList.add('video-hover');
        if (timeout !== null)
          clearTimeout(timeout);
        timeout = setTimeout(() => buttonContainer.classList.remove('video-hover'), 5000);
      });
      el.addEventListener('mouseleave', () => {
        buttonContainer.classList.remove('video-hover');
        if (timeout !== null)
          clearTimeout(timeout);
      });
    }
    setInterval(() => {
      const clientRect = this.video.getBoundingClientRect();
      buttonContainer.style.top = `${clientRect.top + document.documentElement.scrollTop}px`;
      buttonContainer.style.left = `${clientRect.left + document.documentElement.scrollLeft}px`;
    }, 100);
    buttonContainer.addEventListener('click', () => {
      browser.storage.sync.get("serverAddress").then(
        result => {
          if (!result.serverAddress) {
            alert("No LinkPlay-Server specified! Please go to the addon settings and specify a server!")
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
    if (!cssIsInjected) {
      const styleTag = document.createElement('link');
      styleTag.rel = 'stylesheet';
      styleTag.type = 'text/css';
      styleTag.href = browser.runtime.getURL('web.css');
      document.head.append(styleTag);
      cssIsInjected = true;
    }
    document.body.append(this.makeButton());
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

  static fromNode(node) {
    const window = document.defaultView;
    let video;
    if (typeof window.wrappedJSObject.netflix !== 'undefined' && typeof window.wrappedJSObject.netflix.appContext !== 'undefined') {
      console.log('make netflix video');
      video = new NetflixVideo(node);
    } else {
      console.log('make HTML5 video');
      video = new Video(node);
    }
    video.attachLinkPlay();
  }
}


class NetflixVideo extends Video {
  constructor(video) {
    super(video);
    const vp = window.wrappedJSObject.netflix.appContext.state.playerApp.getAPI().videoPlayer;
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


const mutationObserver = new MutationObserver((mutations, _) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLVideoElement) {
        Video.fromNode(node);
      }
      for (const childNode of node.querySelectorAll('video')) {
        Video.fromNode(childNode);
      }
    }
  }
});
for (const node of document.querySelectorAll('video')) {
  const video = new Video(node);
  video.attachLinkPlay();
}

mutationObserver.observe(document, {
  subtree: true,
  childList: true,
})
