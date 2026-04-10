// ============================================================
// src/pages/PeoplePage.jsx
// ============================================================

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../components/Toast";
import "../styles/chat.css";

function Avatar({ name }) {
  return (
    <div className="people-card__avatar">
      {(name || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function PeoplePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [sentIds, setSentIds] = useState(new Set());
  const debounceRef = useRef(null);

  useEffect(() => {
    api.getFriends().then(setFriends).catch(() => {});
    api.getPendingRequests().then(setPending).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.searchUsers(query);
        setSearchResults(res);
      } catch {}
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function sendRequest(userId) {
    try {
      await api.sendFriendRequest(userId);
      setSentIds((prev) => new Set([...prev, userId]));
      toast("Friend request sent!");
    } catch (err) {
      toast(err?.error || "Could not send request.", "error");
    }
  }

  async function accept(req) {
    try {
      await api.acceptRequest(req.id);
      setPending((prev) => prev.filter((r) => r.id !== req.id));
      setFriends((prev) => [...prev, req.sender]);
      toast(`${req.sender.displayName || req.sender.identifier} added!`);
    } catch {
      toast("Failed to accept.", "error");
    }
  }

  async function reject(req) {
    try {
      await api.rejectRequest(req.id);
      setPending((prev) => prev.filter((r) => r.id !== req.id));
      toast("Request declined.");
    } catch {
      toast("Failed to reject.", "error");
    }
  }

  async function openDM(friendId) {
    // Find existing DM room
    try {
      const { result } = await api.getChatrooms();
      const dm = result.find(
        (r) => r.isDirect && r.users?.some((u) => u.id === friendId),
      );
      if (dm) navigate(`/chat/room/${dm.id}`);
    } catch {}
  }

  const friendIds = new Set(friends.map((f) => f.id));

  return (
    <div className="people-page">
      <h1 className="people-page__title">People</h1>
      <p className="people-page__subtitle">
        Find friends by their identifier and start a conversation.
      </p>

      {/* Search */}
      <div className="people-search-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by @identifier…"
        />
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <>
          <p className="people-section-label">Search Results</p>
          <div className="people-list">
            {searchResults.map((u) => {
              const isFriend = friendIds.has(u.id);
              const sent = sentIds.has(u.id);
              return (
                <div key={u.id} className="people-card">
                  <Avatar name={u.displayName || u.identifier} />
                  <div className="people-card__info">
                    <div className="people-card__name">{u.displayName || u.identifier}</div>
                    <div className="people-card__id">@{u.identifier}</div>
                  </div>
                  <div className="people-card__actions">
                    {isFriend ? (
                      <button className="btn btn--sm btn--ghost" onClick={() => openDM(u.id)}>
                        Message
                      </button>
                    ) : sent ? (
                      <span className="badge-pending">Sent</span>
                    ) : (
                      <button className="btn btn--sm btn--primary" onClick={() => sendRequest(u.id)}>
                        Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pending requests */}
      {pending.length > 0 && (
        <>
          <p className="people-section-label">Pending Requests</p>
          <div className="people-list">
            {pending.map((req) => (
              <div key={req.id} className="people-card">
                <Avatar name={req.sender.displayName || req.sender.identifier} />
                <div className="people-card__info">
                  <div className="people-card__name">
                    {req.sender.displayName || req.sender.identifier}
                  </div>
                  <div className="people-card__id">@{req.sender.identifier}</div>
                </div>
                <div className="people-card__actions">
                  <button className="btn btn--sm btn--primary" onClick={() => accept(req)}>
                    Accept
                  </button>
                  <button className="btn btn--sm btn--danger" onClick={() => reject(req)}>
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Friends */}
      <p className="people-section-label">Friends — {friends.length}</p>
      <div className="people-list">
        {friends.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No friends yet. Search for someone above!
          </p>
        )}
        {friends.map((f) => (
          <div key={f.id} className="people-card">
            <Avatar name={f.displayName || f.identifier} />
            <div className="people-card__info">
              <div className="people-card__name">{f.displayName || f.identifier}</div>
              <div className="people-card__id">@{f.identifier}</div>
            </div>
            <div className="people-card__actions">
              <button className="btn btn--sm btn--ghost" onClick={() => openDM(f.id)}>
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
