const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Called once on server startup, before the HTTP/socket server
 * starts listening.
 */
async function initDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env');
  }
  await mongoose.connect(uri);
  console.log('[db] MongoDB connected');
}

module.exports = { initDB };
