/**
 * Communicator for the LinkPlay server communication.
 * 
 * One instance of a WebSocketClient should be created per HTML5 video.
 */
class WebSocketClient {
  /**
   * @param {string} url The full url of the server to communicate with; for example 'wss://localhost:52795'
   * @param {VideoController} video The controller of the 
   * @param {string} group
   */
  constructor(url, video, group) {
    try {
      /** @type {WebSocket} */
      this.webSocket = new WebSocket(url);
    } catch (e) {
      console.error(e);
    }
    this.webSocket.addEventListener('message', event => this.handleMessage(event.data));
    this.webSocket.addEventListener('open', () => this.webSocket.send(group));
    this.video = video;
  }

  /**
   * @param {string} data Handle any message that was sent by the server
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
    this.webSocket.send(`PAUSE`);
  }

  sendPlay() {
    this.webSocket.send(`PLAY`);
  }

  sendTime(time) {
    this.webSocket.send(`TIME ${time}`);
  }
}
