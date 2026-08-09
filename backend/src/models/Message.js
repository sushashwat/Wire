const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  text: { type: String, required: true, trim: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'delivered' },
});

const MessageModel = mongoose.model('Message', messageSchema);

function formatMessage(doc) {
  return {
    id: doc._id.toString(),
    username: doc.username,
    text: doc.text,
    timestamp: doc.timestamp.toISOString(),
    status: doc.status,
  };
}

/**
 * Persists a new chat message.
 * @param {{username: string, text: string}} payload
 * @returns {Promise<object>} the created message record
 */
async function createMessage({ username, text }) {
  const doc = await MessageModel.create({ username, text });
  return formatMessage(doc);
}

/**
 * Returns chat history ordered oldest -> newest.
 * @param {number} limit max number of messages to return
 */
async function getAllMessages(limit = 200) {
  const docs = await MessageModel.find().sort({ timestamp: 1 }).limit(limit);
  return docs.map(formatMessage);
}

module.exports = { createMessage, getAllMessages };
