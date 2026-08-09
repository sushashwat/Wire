import React, { useRef, useState } from 'react';

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('');
  const typingTimeout = useRef(null);

  function handleChange(e) {
    setText(e.target.value);

    onTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 1200);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    onTyping(false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  }

  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder="Write a message…"
        maxLength={2000}
      />
      <button type="submit" disabled={!text.trim()}>
        Send
      </button>
    </form>
  );
}
