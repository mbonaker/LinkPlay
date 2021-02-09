/**
 * Communicator for the LinkPlay server communication.
 * One instance of a Group should be created per HTML5 video.
 * 
 * Groups don't have references to the videos or video controllers. Callbacks/Events are used for that kind of stuff.
 */
class Group {
  /**
   * @param {string} name The name of the group to join
   */
  constructor(name) {
    this.name = name;
    /** @type {WebSocket} */
    this.webSocket = null;

    /**
     * Indicates whether we assume that the collective state is on pause
     * 
     * @type boolean
     */
    this.collectivelyPaused = false;

    /**
     * Indicates the time that we assume is collectively being shown
     * 
     * @type number
     */
    this.assumedTime = 0;

    /**
     * Indicates the time that we strongly assume is collectively being shown
     * 
     * @type number
     */
    this.collectiveTime = 0;

    // Provide some events
    this.onJoin = [];
    this.onDisjoin = [];
    this.onPlay = [];
    this.onPause = [];
    this.onJump = [];
    this.onSync = [];

    /**
     * `null` as long as no joining effort has been made. As soon as a connection is underway or was successful, this will be a promise that is resolved when the connection is stable. After disjoining the group, this will be `null` again and the cycle continues.
     * 
     * @type ?Promise<void>
     */
    this.whenJoined = null;

    this.isJoined = false;

    /**
     * A promise that is fulfilled as soon as no connection is underway or successful.
     * 
     * @type ?Promise<void>
     */
    this.whenDisjoined = new Promise(res => res());
    this.signalDisjoined = null;
  }

  /**
   * Make this group join the web service.
   * 
   * @param {string} url Server url of the web service
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
        this.signalDisjoined();
        this.isJoined = false;
      }
      this.webSocket.addEventListener('open', () => {
        this.webSocket.send(this.name);
        this.isJoined = true;
        res();
        this.onJoin.forEach(fn => fn());
      });
      this.webSocket.addEventListener('message', event => this.handleMessage(event.data));
      this.webSocket.addEventListener('close', () => this.disjoin());
    });
    this.whenDisjoined = new Promise(res => {
      this.signalDisjoined = res;
    });
    return this.whenJoined;
  }

  /**
   * 
   */
  disjoin() {
    this.webSocket.close();
    this.whenJoined = null;
    this.signalDisjoined();
    this.onDisjoin.forEach(fn => fn());
    this.isJoined = false;
  }
  
  /**
   * @param {string} data Handle any message that was sent by the server
   */
  handleMessage(data) {
    if (data.startsWith('JUMP ')) {
      const time = parseFloat(data.substr(5));
      this.collectiveTime = time;
      this.assumedTime = time;
      this.onJump.forEach(fn => fn(time));
    }
    if (data.startsWith('SYNC ')) {
      const time = parseFloat(data.substr(5));
      this.assumedTime = time;
      this.onSync.forEach(fn => fn(time));
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

  sendJump(time) {
    this.webSocket.send(`JUMP ${time}`);
    this.collectiveTime = time;
    this.assumedTime = time;
  }

  sendSync(time) {
    this.webSocket.send(`SYNC ${time}`);
    this.assumedTime = time;
  }
}
