import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name to continue');
      return;
    }
    if (trimmed.length > 24) {
      setError('Keep it under 24 characters');
      return;
    }
    onLogin(trimmed);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-mark">
          <span className="pulse-dot" />
          WIRE
        </div>
        <h1>Join the channel</h1>
        <p className="login-sub">Pick a name. No password, no signup — just show up.</p>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g. jordan"
            maxLength={24}
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit">Enter chat</button>
        </form>
      </div>
    </div>
  );
}
