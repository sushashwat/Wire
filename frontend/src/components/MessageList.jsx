import React, { useEffect, useRef } from 'react';

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(iso) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return 'Today';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

// Deterministic avatar color per username so the same person always gets the same color, without needing to store it anywhere.
const AVATAR_PALETTE = ['#1D4E89', '#2A9D8F', '#B5651D', '#6D4C9F', '#C1443D', '#3A7CA5'];

function avatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initials(name) {
  return name.trim().slice(0, 2).toUpperCase();
}

// Consecutive messages from the same person within this window are
// visually grouped (no repeated avatar/name), like WhatsApp/iMessage.
const GROUP_WINDOW_MS = 5 * 60 * 1000;

export default function MessageList({ messages, currentUser }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  let lastDate = null;

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-state">
          <p>Nothing here yet.</p>
          <span>Send the first message below.</span>
        </div>
      )}

      {messages.map((msg, i) => {
        const isOwn = msg.username === currentUser;
        const dateLabel = formatDateDivider(msg.timestamp);
        const showDivider = dateLabel !== lastDate;
        lastDate = dateLabel;

        const prev = messages[i - 1];
        const groupedWithPrev =
          !showDivider &&
          prev &&
          prev.username === msg.username &&
          new Date(msg.timestamp) - new Date(prev.timestamp) < GROUP_WINDOW_MS;

        const next = messages[i + 1];
        const groupedWithNext =
          next &&
          formatDateDivider(next.timestamp) === dateLabel &&
          next.username === msg.username &&
          new Date(next.timestamp) - new Date(msg.timestamp) < GROUP_WINDOW_MS;

        return (
          <React.Fragment key={msg.id}>
            {showDivider && (
              <div className="date-divider">
                <span>{dateLabel}</span>
              </div>
            )}
            <div
              className={`message-row ${isOwn ? 'own' : 'other'} ${
                groupedWithPrev ? 'grouped-top' : ''
              } ${groupedWithNext ? 'grouped-bottom' : ''}`}
            >
              {!isOwn && (
                <div
                  className="avatar"
                  style={{
                    background: avatarColor(msg.username),
                    visibility: groupedWithNext ? 'hidden' : 'visible',
                  }}
                >
                  {initials(msg.username)}
                </div>
              )}
              <div className="message-bubble">
                {!isOwn && !groupedWithPrev && (
                  <div className="message-author">{msg.username}</div>
                )}
                <div className="message-text">{msg.text}</div>
                <div className="message-meta">
                  <time>{formatTime(msg.timestamp)}</time>
                  {isOwn && <span className="message-status">{msg.status || 'sent'}</span>}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}