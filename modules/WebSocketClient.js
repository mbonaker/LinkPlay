class WebSocketClient {
  /**
   * @param {string} url
   * @param {VideoController} video
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
