const { io } = require('socket.io-client');
const Y = require('yjs');

function runUser(baseUrl, docId, shareToken, updatesToPerform) {
  return new Promise((resolve, reject) => {
    const socket = io(baseUrl, {
      auth: { shareToken },
      transports: ['websocket'],
    });

    const ydoc = new Y.Doc();
    let updatesDone = 0;
    let errors = 0;
    let connected = false;

    socket.on('connect', () => {
      connected = true;
      socket.emit('join-document', { docId });
    });

    socket.on('sync-state', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
      
      // Start simulating typing
      const typeInterval = setInterval(() => {
        if (updatesDone >= updatesToPerform) {
          clearInterval(typeInterval);
          socket.disconnect();
          resolve({ success: true, errors, updatesDone });
          return;
        }

        const ytext = ydoc.getText('content');
        ytext.insert(ytext.length, 'a');
        const stateVector = Y.encodeStateAsUpdate(ydoc);
        socket.emit('send-update', { docId, update: Array.from(stateVector) });
        
        updatesDone++;
      }, 200); // 200ms between typing (5 keystrokes per sec)
    });

    socket.on('receive-update', ({ update }) => {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    });

    socket.on('connect_error', (err) => {
      errors++;
      reject(err);
    });

    socket.on('error', (err) => {
      errors++;
      reject(new Error(err));
    });

    socket.on('disconnect', () => {
      if (updatesDone < updatesToPerform) {
        resolve({ success: false, errors: errors + 1, updatesDone, reason: 'early disconnect' });
      }
    });

    // Timeout
    setTimeout(() => {
      if (connected) socket.disconnect();
      resolve({ success: false, errors: errors + 1, updatesDone, reason: 'timeout' });
    }, Math.max(10000, updatesToPerform * 300));
  });
}

module.exports = { runUser };
