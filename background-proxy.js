browser.storage.sync.get("serverAddress").then(result => {
  if (!result.serverAddress) {
    result.serverAddress = 'linkplay.softwar3.com';
  }
  return result.serverAddress;
}).then(address => {
  browser.runtime.onConnect.addListener(internalConnection => {
    const externalConnection = new WebSocket(`wss://${address}:52795`);
    internalConnection.onDisconnect.addListener(() => {
      externalConnection.close();
    });
    new Promise((res, rej) => {
      externalConnection.onopen = res;
      externalConnection.onclose = rej;
      externalConnection.onerror = rej;
    }).then(() => {
      internalConnection.postMessage("CONNECTED");
      const receiveInternalMessage = fn => internalConnection.onMessage.addListener(msg => new Promise(res => { console.log('internal > external', msg); fn(msg); res(); }));
      const sendInternalMessage = msg => internalConnection.postMessage(msg);
      const receiveExternalMessage = fn => externalConnection.addEventListener('message', ({data}) => { console.log('internal < external', data); fn(data); });
      const sendExternalMessage = msg => externalConnection.send(msg);

      receiveExternalMessage(sendInternalMessage);
      receiveInternalMessage(sendExternalMessage);
    }, e => {
      internalConnection.disconnect();
      console.error('websocket connection error', e);
    });
  });
});
