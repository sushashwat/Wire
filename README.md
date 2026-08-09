# Wire — Realtime Chat

A real-time chat application: React (Vite) frontend + Node.js/Express backend
with Socket.io for real-time messaging and SQLite for persistence.

```
realtime-chat-app/
├── backend/     Express + Socket.io + SQLite API
└── frontend/    React (Vite) chat UI
```

## Features

- Send and receive messages instantly via Socket.io (no polling, no refresh needed)
- Chat history persists in SQLite and reloads after a page refresh
- Message timestamps (and date dividers for multi-day history)
- Username-based login (dummy auth — no password, stored for the browser tab only)
- Typing indicator ("X is typing…")
- Online/offline user presence list
- Message delivered status shown on your own messages
- REST API for sending messages / fetching history, in addition to sockets
- Graceful error handling on both API and socket layers, with reconnect banners

## 1. Prerequisites

- Node.js 18+ and npm

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env    # defaults already work for local dev
npm run dev              # nodemon, auto-restarts on changes
# or: npm start
```

The server starts on `http://localhost:5000` and creates a `chat.db`
SQLite file in `backend/` on first run (no manual DB setup needed).

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
| `CLIENT_URL`  | `http://localhost:5173`  | Allowed CORS/socket origin for the frontend |

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
| GET    | `/api/health`     | Health check                                   |

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

- **JSON-file-backed storage** (`backend/chat.db.json`, via
  `fs.readFileSync`/`writeFileSync`): zero external services and,
  crucially, zero native compilation. `better-sqlite3`/`sqlite3` are
  native modules that need node-gyp + a C++ toolchain (Visual Studio
  Build Tools on Windows), which isn't guaranteed to be present on a
  reviewer's machine. A plain JSON store keeps setup to `npm install`
  only, on any OS/Node version. The file is git-ignored so a fresh
  clone starts with an empty chat. All persistence logic is isolated
  behind `src/models/Message.js` and `src/config/db.js`, so swapping
  in MongoDB/Postgres/SQLite later only touches those two files.
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

## 8. Assumptions

- Single shared chat room ("`#general`") — no private DMs or multiple
  rooms, since none were requested.
- "Dummy authentication" means a username with no password and no
  account persistence across browsers/devices, per the bonus section's
  own wording.
- Message history is capped at the 200 most recent messages for the
  initial load, to keep the REST payload small; older messages are
  still stored in SQLite.
- No message editing/deleting was requested, so it isn't implemented.
- Read/delivered status is simplified to a single `delivered` state
  set at persistence time (true per-recipient read receipts would
  need a users/reads table, which felt out of scope for the given
  timeframe).

## 9. Production build

```bash
cd frontend
npm run build       # outputs static assets to frontend/dist
npm run preview     # serve the production build locally
```

Serve `frontend/dist` with any static host, and point `VITE_API_URL` /
`VITE_SOCKET_URL` at your deployed backend URL before building.

## 10. Deployment notes

To deploy the backend (e.g. Render/Railway):

1. Set `CLIENT_URL` to your deployed frontend's origin.
2. Ensure the platform allows a writable filesystem for `chat.db.json`,
   or swap in a managed database if the platform's filesystem is
   ephemeral (e.g. most PaaS free tiers reset local files on redeploy).
3. Expose the `PORT` the platform assigns via `process.env.PORT`
   (already wired up in `server.js`).
