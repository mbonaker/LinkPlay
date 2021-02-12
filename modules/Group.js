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
    /** @type {browser.runtime.Port} */
    this.internalProxy = null;

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

  _makeBackgroundProxyConnection() {
    return new Promise((res, rej) => {
      console.log('_makeBackgroundProxyConnection');
      try {
        res(browser.runtime.connect());
      } catch (e) {
        rej(e);
      }
    });
  }

  /**
   * @param {browser.runtime.Port} connection
   * @returns {Promise<browser.runtime.Port>}
   * @private
   */
  _establishBackgroundProxyConnection(connection) {
    return new Promise((res, rej) => {
      console.log('_establishBackgroundProxyConnection');
      const handleConnectedMessage = message => {
        console.log('handleConnectedMessage', message);
        if (message !== 'CONNECTED') {
          rej('Background proxy did not connect.');
          return;
        }
        console.log('connected.', message);
        connection.onMessage.removeListener(handleConnectedMessage);
        console.log('res.', message);
        res(connection);
      };
      connection.onMessage.addListener(handleConnectedMessage);
    });
  }

  /**
   * @param {browser.runtime.Port} connection
   * @private
   */
  _listenToBackgroundProxyConnection(connection) {
    console.log('_listenToBackgroundProxyConnection');
    connection.postMessage(this.name);
    connection.onMessage.addListener(message => this.handleMessage(message));
    connection.onDisconnect.addListener(() => this.disjoin());
    return connection;
  }

  /**
   * Make this group join the web service.
   *
   * @returns {Promise<void>}
   */
  join() {
    if (this.whenJoined !== null)
      throw new Error('Cannot join a group that is already joined.');
    this.whenJoined = new Promise((resJoined, rejJoined) => {
      this._makeBackgroundProxyConnection().then(connection =>
        this._establishBackgroundProxyConnection(connection)
      ).then(connection => {
        console.log('joined');
        this.internalProxy = connection;
        this.isJoined = true;
        console.log('resJoined');
        resJoined();
        console.log('joined event');
        this.onJoin.forEach(fn => fn());
        console.log('joined return');
        return connection;
      }).then(connection =>
        this._listenToBackgroundProxyConnection(connection)
      ).catch(e => {
        console.error(e);
        rejJoined(e);
        this.signalDisjoined();
        this.isJoined = false;
      })
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
    this.internalProxy.disconnect();
    this.whenJoined = null;
    this.signalDisjoined();
    this.onDisjoin.forEach(fn => fn());
    this.isJoined = false;
  }
  
  /**
   * @param {string} message Handle any message that was sent by the server
   */
  handleMessage(message) {
    if (message.startsWith('JUMP ')) {
      const time = parseFloat(message.substr(5));
      this.collectiveTime = time;
      this.assumedTime = time;
      this.onJump.forEach(fn => fn(time));
    }
    if (message.startsWith('SYNC ')) {
      const time = parseFloat(message.substr(5));
      this.assumedTime = time;
      this.onSync.forEach(fn => fn(time));
    }
    if (message === 'PLAY') {
      this.collectivelyPaused = false;
      this.onPlay.forEach(fn => fn());
    }
    if (message === 'PAUSE') {
      this.collectivelyPaused = true;
      this.onPause.forEach(fn => fn());
    }
  }

  sendPause() {
    this.collectivelyPaused = true;
    return this.internalProxy.postMessage(`PAUSE`);
  }

  sendPlay() {
    this.collectivelyPaused = false;
    return this.internalProxy.postMessage(`PLAY`);
  }

  sendJump(time) {
    this.collectiveTime = time;
    this.assumedTime = time;
    return this.internalProxy.postMessage(`JUMP ${time}`);
  }

  sendSync(time) {
    this.assumedTime = time;
    return this.internalProxy.postMessage(`SYNC ${time}`);
  }
}
