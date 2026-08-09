import React, { useCallback, useEffect, useState } from 'react';
import { socket } from '../services/socket';
import { fetchMessages } from '../services/api';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow({ username, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connError, setConnError] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load chat history over REST so messages survive a refresh,
  // then open the socket for real-time updates.
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const history = await fetchMessages();
        if (!cancelled) setMessages(history);
      } catch (err) {
        if (!cancelled) setConnError('Could not load chat history.');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    socket.connect();
    socket.emit('user_join', username);

    function handleReceiveMessage(message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }

    function handleOnlineUsers(users) {
      setOnlineUsers(users);
    }

    function handleTyping({ username: who, isTyping }) {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(who) ? prev : [...prev, who];
        }
        return prev.filter((u) => u !== who);
      });
    }

    function handleConnectError() {
      setConnError('Connection lost. Trying to reconnect…');
    }

    function handleConnect() {
      setConnError('');
      socket.emit('user_join', username);
    }

    socket.on('connect', handleConnect);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('online_users', handleOnlineUsers);
    socket.on('typing', handleTyping);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('online_users', handleOnlineUsers);
      socket.off('typing', handleTyping);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleConnectError);
      socket.disconnect();
    };
  }, [username]);

  const handleSend = useCallback(
    (text) => {
      socket.emit('send_message', { username, text }, (ack) => {
        if (ack?.error) setConnError(ack.error);
      });
    },
    [username]
  );

  const handleTypingChange = useCallback(
    (isTyping) => {
      socket.emit('typing', { username, isTyping });
    },
    [username]
  );

  return (
    <div className="chat-app">
      <UserList users={onlineUsers} currentUser={username} />

      <div className="chat-main">
        <header className="chat-header">
          <div className="chat-header-title">
            <span className="pulse-dot" />
            <h2>#general</h2>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            {username} · leave
          </button>
        </header>

        {connError && <div className="banner-error">{connError}</div>}

        {loadingHistory ? (
          <div className="loading-state">Loading messages…</div>
        ) : (
          <MessageList messages={messages} currentUser={username} />
        )}

        <TypingIndicator typingUsers={typingUsers.filter((u) => u !== username)} />
        <MessageInput onSend={handleSend} onTyping={handleTypingChange} />
      </div>
    </div>
  );
}
