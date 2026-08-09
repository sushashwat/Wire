const Message = require('../models/Message');

// socket.id -> username, kept in memory for online-status tracking
const onlineUsers = new Map();

function broadcastOnlineUsers(io) {
  const uniqueUsernames = Array.from(new Set(onlineUsers.values()));
  io.emit('online_users', uniqueUsernames);
}

/**
 * Wires up all Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // Client announces who they are right after connecting
    socket.on('user_join', (username) => {
      try {
        if (!username || typeof username !== 'string') return;
        onlineUsers.set(socket.id, username);
        socket.data.username = username;
        broadcastOnlineUsers(io);
        socket.broadcast.emit('user_status', { username, status: 'online' });
      } catch (err) {
        console.error('[socket] user_join error:', err);
      }
    });

    // Real-time message send -> persist -> broadcast to everyone
    socket.on('send_message', async (data, callback) => {
      try {
        const { username, text } = data || {};
        if (!username || !text || !text.trim()) {
          if (typeof callback === 'function') callback({ error: 'Invalid message' });
          return;
        }
        const message = await Message.createMessage({ username, text: text.trim() });
        io.emit('receive_message', message);
        if (typeof callback === 'function') callback({ success: true, message });
      } catch (err) {
        console.error('[socket] send_message error:', err);
        if (typeof callback === 'function') callback({ error: 'Failed to send message' });
      }
    });

    // Typing indicator relay
    socket.on('typing', ({ username, isTyping } = {}) => {
      if (!username) return;
      socket.broadcast.emit('typing', { username, isTyping: !!isTyping });
    });

    socket.on('disconnect', () => {
      const username = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);
      if (username) {
        broadcastOnlineUsers(io);
        socket.broadcast.emit('user_status', { username, status: 'offline' });
      }
      console.log(`[socket] disconnected: ${socket.id}`);
    });

    socket.on('error', (err) => {
      console.error('[socket] socket error:', err);
    });
  });
}

module.exports = initSocket;
