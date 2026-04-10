// ============================================================
// src/pages/ChatRoom.jsx — polling every 3 s
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import "../styles/chat.css";

const POLL_MS = 3000;

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function groupMessages(messages) {
  const groups = [];
  messages.forEach((msg) => {
    const last = groups[groups.length - 1];
    if (last && last.senderId === msg.senderId) {
      last.messages.push(msg);
    } else {
      groups.push({
        senderId: msg.senderId,
        senderName: msg.sender?.displayName || msg.sender?.identifier || "Unknown",
        firstTime: msg.createdAt,
        messages: [msg],
      });
    }
  });
  return groups;
}

export default function ChatRoom() {
  const { chatroomId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [room, setRoom] = useState(null);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.getMessages(chatroomId);
      setMessages(Array.isArray(data) ? data : []);
    } catch {}
  }, [chatroomId]);

  // Initial load + room info
  useEffect(() => {
    setMessages([]);
    setRoom(null);

    api.getChatroom(chatroomId).then(setRoom).catch(() => {});
    fetchMessages();

    // Poll
    pollRef.current = setInterval(fetchMessages, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [chatroomId, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      await api.sendMessage({ text_content: content, chatroomId });
      setText("");
      await fetchMessages();
    } catch {}
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {}
  }

  async function handleEditSave(id) {
    if (!editText.trim()) return;
    try {
      const { updatedmessage } = await api.editMessage(id, { text_content: editText });
      setMessages((prev) => prev.map((m) => (m.id === id ? updatedmessage : m)));
      setEditingId(null);
    } catch {}
  }

  const groups = groupMessages(messages);

  // Derive header info
  let headerName = room?.roomName || "Loading…";
  let headerSub = null;
  if (room?.isDirect) {
    const other = room.users?.find((u) => u.id !== user.id);
    if (other) {
      headerName = other.displayName || other.identifier;
      headerSub = `@${other.identifier}`;
    }
  }

  return (
    <>
      <header className="chat-header">
        <div>
          <div className="chat-header__title">{headerName}</div>
          {headerSub && <div className="chat-header__sub">{headerSub}</div>}
        </div>
      </header>

      <div className="messages-area">
        {groups.map((g, gi) => (
          <div key={gi} className="msg-group">
            <div className="msg-group__header">
              <span className="msg-group__name">{g.senderName}</span>
              <span className="msg-group__time">{formatTime(g.firstTime)}</span>
            </div>
            {g.messages.map((msg) => {
              const isOwn = msg.senderId === user.id;
              return (
                <div key={msg.id} className="msg-bubble-row">
                  <div className="msg-avatar-spacer" />
                  {editingId === msg.id ? (
                    <div style={{ flex: 1, display: "flex", gap: 8 }}>
                      <input
                        className="form-input"
                        style={{ flex: 1, fontSize: "0.9rem" }}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditSave(msg.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button className="btn btn--sm btn--primary" onClick={() => handleEditSave(msg.id)}>Save</button>
                      <button className="btn btn--sm btn--ghost" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className={`msg-bubble${isOwn ? " msg-bubble--own" : ""}`}>
                      {msg.content}
                      {msg.edited && <span className="msg-edited">(edited)</span>}
                    </div>
                  )}
                  {isOwn && editingId !== msg.id && (
                    <div className="msg-actions">
                      <button
                        className="msg-action-btn"
                        title="Edit"
                        onClick={() => { setEditingId(msg.id); setEditText(msg.content); }}
                      >✎</button>
                      <button
                        className="msg-action-btn msg-action-btn--danger"
                        title="Delete"
                        onClick={() => handleDelete(msg.id)}
                      >✕</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="input-bar">
        <div className="input-bar__inner">
          <textarea
            className="input-bar__textarea"
            rows={1}
            placeholder={`Message ${headerName}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="input-bar__send"
            onClick={handleSend}
            disabled={!text.trim() || sending}
            aria-label="Send"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
