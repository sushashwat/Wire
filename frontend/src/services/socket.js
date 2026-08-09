import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// autoConnect is disabled so we only open the connection once the
// user has "logged in" with a username.
export const socket = io(SOCKET_URL, {
  autoConnect: false,
});
