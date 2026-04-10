// ============================================================
// src/api.js — centralized fetch helpers
// ============================================================

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request("POST", "/login", { username: email, password }),
  signup: (identifier, email, password, password_confirm) =>
    request("POST", "/sign-up", { identifier, email, password, password_confirm }),

  // User
  getUser: (id) => request("GET", `/user/${id}`),
  editUser: (id, body) => request("PATCH", `/user/${id}/edituser`, body),
  editPassword: (id, body) => request("PATCH", `/user/${id}/editpassword`, body),
  deleteUser: (id) => request("DELETE", `/user/${id}/delete`),

  // Chatrooms
  getChatrooms: () => request("GET", "/chatroom/"),
  getChatroom: (id) => request("GET", `/chatroom/${id}`),
  getChatroomUsers: (id) => request("GET", `/chatroom/${id}/users`),
  createChatroom: (body) => request("POST", "/chatroom/new", body),
  editChatroom: (id, body) => request("PATCH", `/chatroom/${id}/edit`, body),
  deleteChatroom: (id) => request("DELETE", `/chatroom/${id}/delete`),
  addUser: (chatroomId, userId) =>
    request("PATCH", `/chatroom/${chatroomId}/adduser/${userId}`),
  removeUser: (chatroomId, userId) =>
    request("PATCH", `/chatroom/${chatroomId}/removeuser/${userId}`),

  // Messages
  getMessages: (chatroomId) =>
    request("GET", `/message/inchatroom/${chatroomId}`),
  sendMessage: (body) => request("POST", "/message/new", body),
  editMessage: (id, body) => request("PATCH", `/message/${id}/editmessage`, body),
  deleteMessage: (id) => request("DELETE", `/message/${id}/delete`),

  // Friends
  searchUsers: (q) => request("GET", `/friend/search?q=${encodeURIComponent(q)}`),
  getFriends: () => request("GET", "/friend/"),
  getPendingRequests: () => request("GET", "/friend/pending"),
  sendFriendRequest: (userId) => request("POST", `/friend/request/${userId}`),
  acceptRequest: (id) => request("PATCH", `/friend/accept/${id}`),
  rejectRequest: (id) => request("PATCH", `/friend/reject/${id}`),
};
