# Wire — Realtime Chat

A real-time chat application: React (Vite) frontend + Node.js/Express backend
with Socket.io for real-time messaging and MongoDB for persistence.

```
realtime-chat-app/
├── backend/     Express + Socket.io + MongoDB (Mongoose) API
└── frontend/    React (Vite) chat UI
```

## 🔗 Live demo

| | |
|---|---|
| **Frontend (live app)** | https://wire-eosin.vercel.app |
| **Backend (API)**       | https://wire-bn0v.onrender.com |
| **Health check**        | https://wire-bn0v.onrender.com/api/health |

> Note: the backend is on Render's free tier, which spins down after
> ~15 minutes of inactivity. A monitor (UptimeRobot) pings the health
> endpoint every 5 minutes to keep it warm, but the very first request
> after a long idle period may still take 20–40s to respond.

## Features

- Send and receive messages instantly via Socket.io (no polling, no refresh needed)
- Chat history persists in MongoDB and reloads after a page refresh
- Message timestamps with date dividers for multi-day history
- Username-based login (dummy auth — no password, stored for the browser tab only)
- Typing indicator ("X is typing…")
- Online/offline user presence list, with a slide-in drawer on mobile
- Message delivered status shown on your own messages
- Chat-bubble UI with per-user avatars and consecutive-message grouping
- REST API for sending messages / fetching history, in addition to sockets
- Graceful error handling on both API and socket layers, with reconnect banners

## 1. Prerequisites

- Node.js 18+ and npm
- A MongoDB connection string (MongoDB Atlas free tier works fine)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env    # then paste your MongoDB Atlas URI into MONGODB_URI
npm run dev              # nodemon, auto-restarts on changes
# or: npm start
```

The server starts on `http://localhost:5000` once it successfully
connects to MongoDB (connection happens before the server starts
listening — if `MONGODB_URI` is missing or unreachable, the process
logs the error and exits instead of starting in a broken state).

Health check: `GET http://localhost:5000/api/health`

## 3. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env    # defaults already work for local dev
npm run dev
```

Open `http://localhost:5173`, pick a username, and start chatting.
Open a second browser tab (or an incognito window) with a different
username to see real-time delivery, typing indicators, and presence
update live.

## 4. Environment variables

**backend/.env**

| Variable      | Default                 | Description                              |
|---------------|--------------------------|-------------------------------------------|
| `PORT`        | `5000`                   | Port the Express/Socket.io server listens on |
| `CLIENT_URL`  | `http://localhost:5173`  | Allowed CORS/socket origin for the frontend (must exactly match the frontend's origin, no trailing slash) |
| `MONGODB_URI` | *(required, no default)* | MongoDB Atlas (or local) connection string |

**frontend/.env**

| Variable            | Default                        | Description                    |
|---------------------|----------------------------------|---------------------------------|
| `VITE_API_URL`      | `http://localhost:5000/api`     | Base URL for REST calls         |
| `VITE_SOCKET_URL`   | `http://localhost:5000`         | Base URL for the Socket.io connection |

## 5. REST API

| Method | Route             | Description                                  |
|--------|-------------------|-----------------------------------------------|
| GET    | `/api/messages`   | Returns full chat history, oldest first       |
| POST   | `/api/messages`   | Body: `{ "username": "...", "text": "..." }` — persists and broadcasts a message |
| GET    | `/api/health`     | Health check (also used by the uptime monitor) |
| GET    | `/`               | Lightweight root ping, for monitors that hit the base URL |

## 6. Socket.io events

| Event (client → server) | Payload                              | Purpose                          |
|--------------------------|---------------------------------------|------------------------------------|
| `user_join`              | `username`                            | Announces presence on connect      |
| `send_message`           | `{ username, text }`, ack callback    | Sends a message                     |
| `typing`                 | `{ username, isTyping }`              | Typing indicator                    |

| Event (server → client) | Payload                                   | Purpose                        |
|---------------------------|---------------------------------------------|----------------------------------|
| `receive_message`        | message object                              | New message broadcast            |
| `online_users`            | `string[]`                                  | Current list of online usernames |
| `user_status`             | `{ username, status: 'online'\|'offline' }` | Presence change                  |
| `typing`                  | `{ username, isTyping }`                    | Relay of a peer's typing state   |

## 7. Design decisions

- **React (web), not React Native**: the assignment listed React
  Native as preferred but explicitly allowed React as an alternative.
  React was chosen to guarantee a fully working, deployable, and
  demoable product within the 24-hour window, without the added
  overhead of native builds/APK generation. All required real-time
  behavior (Socket.io messaging, typing indicators, presence) works
  identically to how it would in a React Native client.
- **MongoDB via Mongoose**: matches the assignment's bonus requirement
  directly ("Store messages in MongoDB, SQLite, or another database").
  A managed Atlas cluster also means zero local DB setup for anyone
  running the project — just drop a connection string in `.env`. All
  persistence logic is isolated behind `src/models/Message.js` and
  `src/config/db.js`, so the rest of the app (controllers, socket
  handlers) never touches Mongoose directly.
- **Both REST and Socket.io write paths**: the spec requires a REST
  "send message" endpoint *and* mandates Socket.io for real-time
  delivery. Rather than have two disconnected paths, both the REST
  controller and the socket handler call the same `Message` model and
  broadcast through the same `io.emit`, so a message sent by either
  path is consistent and instantly visible to everyone.
- **Clean layering on the backend**: `routes → controllers → models`,
  with sockets as a parallel entry point into the same model layer.
  Keeps business logic out of the transport layer (Express vs Socket.io).
- **Dummy auth via a username-only login**: the spec explicitly calls
  this out as a bonus, not full auth. The name is kept in
  `sessionStorage` (not `localStorage`) so each tab can act as a
  distinct user — handy for testing real-time behavior locally.
- **Typing indicator debounced client-side**: a 1.2s timeout after the
  last keystroke turns "typing" off automatically, so a stalled client
  doesn't leave a stuck "is typing…" indicator for everyone else.
- **Optimistic-free UI**: sent messages are rendered only once the
  server broadcasts them back (via the same `receive_message` event
  the sender also listens to), so the UI never shows a message the
  server failed to persist.
- **Mobile-first sidebar as a drawer, not a hidden panel**: on narrow
  screens the online-users list moves off-canvas into a slide-in
  drawer (toggled from a header button showing the online count)
  instead of being removed entirely, so the "online/offline status"
  bonus feature stays fully usable on mobile.
- **Chat-bubble UI with grouped messages**: consecutive messages from
  the same user within a 5-minute window are visually grouped (avatar
  and name shown once) for a more familiar, WhatsApp/iMessage-style
  reading experience, with deterministic per-user avatar colors.

## 8. Assumptions

- Single shared chat room ("`#general`") — no private DMs or multiple
  rooms, since none were requested.
- "Dummy authentication" means a username with no password and no
  account persistence across browsers/devices, per the bonus section's
  own wording.
- Message history is capped at the 200 most recent messages for the
  initial load, to keep the REST payload small; older messages remain
  in MongoDB and are simply not fetched by default.
- No message editing/deleting was requested, so it isn't implemented.
- Read/delivered status is simplified to a single `delivered` state
  set at persistence time (true per-recipient read receipts would
  need a users/reads table, which felt out of scope for the given
  timeframe).
- React (web) was used instead of React Native (see Design Decisions),
  so the submission includes a screen recording instead of an APK.

## 9. Production build

```bash
cd frontend
npm run build       # outputs static assets to frontend/dist
npm run preview     # serve the production build locally
```

Serve `frontend/dist` with any static host, and point `VITE_API_URL` /
`VITE_SOCKET_URL` at your deployed backend URL before building.

## 10. Deployment

**Backend — Render**
1. New Web Service → connect the GitHub repo → **Root Directory**: `backend`
2. Build command: `npm install` · Start command: `npm start`
3. Environment variables: `MONGODB_URI`, `CLIENT_URL` (set to the
   deployed frontend's exact origin, no trailing slash)
4. In MongoDB Atlas, allow network access from `0.0.0.0/0` (Render's
   outbound IPs aren't static on the free tier)

**Frontend — Vercel**
1. New Project → import the same repo → **Root Directory**: `frontend`
2. Framework preset: Vite (auto-detected) · Build command: `npm run build` · Output: `dist`
3. Environment variables: `VITE_API_URL` = `<backend URL>/api`,
   `VITE_SOCKET_URL` = `<backend URL>`
4. After the first deploy, copy the **production domain** from
   Vercel's Domains tab and set it as `CLIENT_URL` back on Render,
   then redeploy the backend

**Keeping the backend warm**
Render's free tier sleeps after ~15 minutes idle. A free
[UptimeRobot](https://uptimerobot.com) HTTP monitor is pointed at
`GET /api/health` every 5 minutes to prevent cold starts during
review/demo.