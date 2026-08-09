require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const messageRoutes = require('./src/routes/messageRoutes');
const initSocket = require('./src/socket/socketHandler');
const { initDB } = require('./src/config/db');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Make io available to REST controllers so REST-created messages
// are also broadcast in real time.
app.set('io', io);

app.use('/api/messages', messageRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[express] unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initSocket(io);

// Connect to MongoDB first, then start accepting connections.
initDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[db] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
