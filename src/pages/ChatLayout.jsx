// ============================================================
// src/pages/ChatLayout.jsx
// ============================================================

import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ToastProvider } from "../components/Toast";
import "../styles/chat.css";

export default function ChatLayout() {
  return (
    <ToastProvider>
      <div className="chat-layout">
        <Sidebar />
        <main className="chat-main">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
