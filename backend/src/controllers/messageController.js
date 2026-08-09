const Message = require('../models/Message');

/**
 * GET /api/messages
 * Returns full chat history so the frontend can render previous messages after a page refresh.
 */
async function getMessages(req, res) {
  try {
    const messages = await Message.getAllMessages();
    res.json({ messages });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

/**
 * POST /api/messages
 * Persists a message and broadcasts it to all connected sockets.
 * This REST route exists so message creation also works over plain
 * HTTP (e.g. for clients/tools that aren't using the socket).
 */
async function postMessage(req, res) {
  try {
    const { username, text } = req.body;
    if (!username || !text || !text.trim()) {
      return res.status(400).json({ error: 'username and text are required' });
    }

    const message = await Message.createMessage({ username, text: text.trim() });

    const io = req.app.get('io');
    if (io) io.emit('receive_message', message);

    res.status(201).json({ message });
  } catch (err) {
    console.error('postMessage error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

module.exports = { getMessages, postMessage };
