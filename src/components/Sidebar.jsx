// ============================================================
// src/components/Sidebar.jsx
// ============================================================

import { Settings } from 'lucide-react';
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import EditDisplayNameModal from "./EditDisplayNameModal";
import "../styles/sidebar.css";

function initials(user) {
  const name = user.displayName || user.identifier || "?";
  return name.slice(0, 2).toUpperCase();
}

function roomLabel(room, currentUserId) {
  if (!room.isDirect) return { name: room.roomName || "Unnamed Room", id: null };
  const other = room.users?.find((u) => u.id !== currentUserId);
  if (!other) return { name: room.roomName || "DM", id: null };
  return {
    name: other.displayName || other.identifier,
    id: `@${other.identifier}`,
  };
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState([]);
  const [showEditName, setShowEditName] = useState(false);

  useEffect(() => {
    api
      .getChatrooms()
      .then(({ result }) => {
        // Filter to rooms the current user is a member of
        const myRooms = result.filter((r) =>
          r.users?.some((u) => u.id === user.id),
        );
        setRooms(myRooms);
      })
      .catch(() => {});
  }, [user.id]);

  const activeId = location.pathname.split("/room/")[1];

  return (
    <>
      <aside className="sidebar">
        {/* Top */}
        <div className="sidebar__top">
          <span className="sidebar__brand">murmur</span>
          <button
            className="sidebar__search-btn"
            onClick={() => navigate("/chat/people")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Find people
          </button>
        </div>

        {/* Room list */}
        <p className="sidebar__section-label">Messages</p>
        <nav className="sidebar__list">
          {rooms.length === 0 && (
            <p style={{ padding: "8px 10px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              No conversations yet
            </p>
          )}
          {rooms.map((room) => {
            const { name, id: subId } = roomLabel(room, user.id);
            const avatar = subId
              ? name.slice(0, 2).toUpperCase()
              : (room.roomName || "?").slice(0, 2).toUpperCase();

            return (
              <div
                key={room.id}
                className={`sidebar__item${activeId === room.id ? " sidebar__item--active" : ""}`}
                onClick={() => navigate(`/chat/room/${room.id}`)}
              >
                <div className="sidebar__avatar">{avatar}</div>
                <div className="sidebar__item-text">
                  <span className="sidebar__item-name">{name}</span>
                  {subId && <span className="sidebar__item-id">{subId}</span>}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar__footer">
          <div className="sidebar__avatar" style={{ cursor: "pointer" }} onClick={() => setShowEditName(true)}>
            {initials(user)}
          </div>
          <div className="sidebar__footer-info">
            <div className="sidebar__footer-name">{user.displayName || user.identifier}</div>
            <div className="sidebar__footer-id">@{user.identifier}</div>
          </div>
          
          <button
            className="sidebar__footer-btn"
            title="Settings"
            onClick={() => navigate("/settings/password")}
          >
            <Settings size={20} />
          </button>
            
          
          <button
            className="sidebar__footer-btn"
            title="Log out"
            onClick={logout}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {showEditName && (
        <EditDisplayNameModal onClose={() => setShowEditName(false)} />
      )}
    </>
  );
}
