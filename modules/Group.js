/**
 * Communicator for the LinkPlay server communication.
 * 
 * One instance of a Group should be created per HTML5 video.
 */
class Group {
  /**
   * @param {string} name The name of the group to join
   */
  constructor(name) {
    this.name = name;
    /** @type {WebSocket} */
    this.webSocket = null;
    this.collectivelyPaused = false;
    this.collectiveTime = 0;
    this.onJoin = [];
    this.onDisjoin = [];
    this.onPlay = [];
    this.onPause = [];
    this.onSetTime = [];
    this.whenJoined = null;
    this.whenDisjoined = new Promise(res => res());
    this.signalDisjoined = null;
  }

  /**
   * 
   * @param {string} url
   * @returns {Promise<void>}
   */
  join(url) {
    if (this.whenJoined !== null)
      throw new Error('Cannot join a group that is already joined.');
    this.whenJoined = new Promise((res, rej) => {
      try {
        /** @type {WebSocket} */
        this.webSocket = new WebSocket(url);
      } catch (e) {
        console.error(e);
        rej(e);
      }
      this.webSocket.addEventListener('open', () => {
        this.webSocket.send(this.name);
        res();
        this.onJoin.forEach(fn => fn());
      });
      this.webSocket.addEventListener('message', event => this.handleMessage(event.data));
    });
    this.whenDisjoined = new Promise(res => {
      this.signalDisjoined = res;
    });
    return this.whenJoined;
  }

  disjoin() {
    this.webSocket.close();
    this.whenJoined = null;
    this.signalDisjoined();
    this.onDisjoin.forEach(fn => fn());
  }
  
  /**
   * @param {string} data Handle any message that was sent by the server
   */
  handleMessage(data) {
    if (data.startsWith('TIME ')) {
      const time = parseFloat(data.substr(5));
      this.collectiveTime = time;
      this.onSetTime.forEach(fn => fn(time));
    }
    if (data === 'PLAY') {
      this.collectivelyPaused = false;
      this.onPlay.forEach(fn => fn());
    }
    if (data === 'PAUSE') {
      this.collectivelyPaused = true;
      this.onPause.forEach(fn => fn());
    }
  }

  sendPause() {
    this.webSocket.send(`PAUSE`);
    this.collectivelyPaused = true;
  }

  sendPlay() {
    this.webSocket.send(`PLAY`);
    this.collectivelyPaused = false;
  }

  sendTime(time) {
    this.webSocket.send(`TIME ${time}`);
    this.collectiveTime = time;
  }
}
