import React, { useState } from 'react';
import Login from './components/Login';
import ChatWindow from './components/ChatWindow';

const STORAGE_KEY = 'wire_chat_username';

export default function App() {
  const [username, setUsername] = useState(() => sessionStorage.getItem(STORAGE_KEY));

  function handleLogin(name) {
    sessionStorage.setItem(STORAGE_KEY, name);
    setUsername(name);
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setUsername(null);
  }

  return username ? (
    <ChatWindow username={username} onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  );
}
