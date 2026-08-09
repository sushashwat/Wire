import React from 'react';

export default function UserList({ users, currentUser, isOpen, onClose }) {
  return (
    <aside className={`user-list ${isOpen ? 'open' : ''}`}>
      <div className="user-list-header">
        <span className="user-list-title">Online</span>
        <span className="user-list-count">{users.length}</span>
        {onClose && (
          <button className="sidebar-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>
      <ul>
        {users.map((u) => (
          <li key={u} className={u === currentUser ? 'is-you' : ''}>
            <span className="status-dot online" />
            {u}
            {u === currentUser && <span className="you-tag">you</span>}
          </li>
        ))}
        {users.length === 0 && <li className="empty-row">No one else here yet</li>}
      </ul>
    </aside>
  );
}