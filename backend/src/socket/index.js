const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Y = require('yjs');
const Document = require('../models/Document');
const metrics = require('../utils/metrics');

const docs = new Map();
const saveTimers = new Map();

function getOrCreateYDoc(docId, savedState) {
  if (docs.has(docId)) return docs.get(docId);
  const ydoc = new Y.Doc();
  if (savedState && savedState.length > 0) {
    Y.applyUpdate(ydoc, savedState);
  }
  docs.set(docId, ydoc);
  metrics.setActiveDocuments(docs.size);
  return ydoc;
}

async function executeSave(docId, ydoc) {
  const start = Date.now();
  try {
    const state = Y.encodeStateAsUpdate(ydoc);
    const text = ydoc.getText('content').toString();
    await Document.findByIdAndUpdate(docId, {
      yjsState: Buffer.from(state),
      content: text,
      updatedAt: new Date(),
    });
    metrics.recordDbSaveExecuted(Date.now() - start);
  } catch (e) {
    console.error('Save error:', e.message);
  }
}

function scheduleSave(docId, ydoc) {
  metrics.recordDbSaveScheduled();
  
  if (process.env.DISABLE_DEBOUNCE === 'true') {
    executeSave(docId, ydoc);
    return;
  }

  if (saveTimers.has(docId)) clearTimeout(saveTimers.get(docId));
  saveTimers.set(docId, setTimeout(() => executeSave(docId, ydoc), 2000));
}

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      const { shareToken } = socket.handshake.auth;
      if (shareToken) {
        socket.user = { _id: 'guest_' + Math.random().toString(36).substr(2,6), name: 'Guest', color: '#888888', isGuest: true };
        socket.shareToken = shareToken; // Store for auth checks
        return next();
      }
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    metrics.recordSocketConnection();

    socket.on('join-document', async ({ docId }) => {
      const start = Date.now();
      try {
        const dbDoc = await Document.findById(docId);
        if (!dbDoc) return socket.emit('error', 'Document not found');

        // SECURITY FIX: Enforce document access control
        let canAccess = false;
        if (socket.user.isGuest) {
            canAccess = dbDoc.isPublic && (dbDoc.shareToken === socket.shareToken);
        } else {
            canAccess = 
              dbDoc.owner.toString() === socket.user._id.toString() ||
              dbDoc.collaborators.some(c => c.toString() === socket.user._id.toString()) ||
              dbDoc.isPublic;
        }

        if (!canAccess) {
            return socket.emit('error', 'Access denied');
        }

        await socket.join(docId);

        const ydoc = getOrCreateYDoc(docId, dbDoc.yjsState);

        const stateVector = Y.encodeStateAsUpdate(ydoc);
        socket.emit('sync-state', { update: Array.from(stateVector) });

        const roomUsers = [];
        const sockets = await io.in(docId).fetchSockets();
        for (const s of sockets) {
          if (s.user) roomUsers.push({ socketId: s.id, user: s.user, cursor: s.cursor || null });
        }
        socket.emit('presence-update', { users: roomUsers });

        socket.to(docId).emit('user-joined', {
          socketId: socket.id,
          user: socket.user,
        });

        socket.currentDoc = docId;
        metrics.recordSocketJoin(Date.now() - start);
      } catch (e) {
        metrics.recordSocketError();
        socket.emit('error', e.message);
      }
    });

    socket.on('send-update', ({ docId, update }) => {
      metrics.recordSocketUpdate();
      const ydoc = docs.get(docId);
      if (!ydoc) return;

      Y.applyUpdate(ydoc, new Uint8Array(update));
      socket.to(docId).emit('receive-update', { update });
      scheduleSave(docId, ydoc);
    });

    socket.on('cursor-update', ({ docId, cursor }) => {
      socket.cursor = cursor;
      socket.to(docId).emit('cursor-update', {
        socketId: socket.id,
        user: socket.user,
        cursor,
      });
    });

    socket.on('title-change', ({ docId, title }) => {
      socket.to(docId).emit('title-change', { title });
    });

    socket.on('disconnect', () => {
      metrics.recordSocketDisconnection();
      if (socket.currentDoc) {
        socket.to(socket.currentDoc).emit('user-left', { socketId: socket.id });
      }
    });
  });

  return io;
}

module.exports = { setupSocket };
