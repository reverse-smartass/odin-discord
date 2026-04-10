// ============================================================
// src/pages/NotPermittedPage.jsx
// ============================================================

import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import "../styles/auth.css";

export default function NotPermittedPage() {
  const { user } = useAuth();

  return (
    <div className="auth-shell">
      <div className="not-permitted">
        <div className="not-permitted__code">403</div>
        <h1 className="not-permitted__title">Access denied</h1>
        <p className="not-permitted__sub">
          You need to be signed in to view this page.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {user ? (
            <Link to="/chat" className="btn btn--primary" style={{ width: "auto" }}>
              Go to chat
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn--primary" style={{ width: "auto" }}>
                Sign in
              </Link>
              <Link to="/" className="btn btn--ghost" style={{ width: "auto" }}>
                Home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
