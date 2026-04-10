// ============================================================
// src/pages/ChangePasswordPage.jsx
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import "../styles/auth.css";

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSuccess(false);

    if (form.new_password !== form.new_password_confirm) {
      setErrors(["New passwords do not match."]);
      return;
    }

    setLoading(true);
    try {
      await api.editPassword(user.id, {
        old_password: form.old_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setForm({ old_password: "", new_password: "", new_password_confirm: "" });
      // Log out after password change for security
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 1800);
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors.map((e) => e.msg));
      } else {
        setErrors([err?.error || "Something went wrong."]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="auth-shell"
      style={{ background: "var(--bg-base)", justifyContent: "flex-start" }}
    >
      <div className="settings-page" style={{ width: "100%" }}>
        <Link to="/chat" className="settings-page__back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to chat
        </Link>

        <h1 className="settings-page__title">Change Password</h1>

        {errors.length > 0 && (
          <div className="form-errors-box" style={{ marginBottom: 20 }}>
            {errors.map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "rgba(76,175,130,.12)",
              border: "1px solid rgba(76,175,130,.3)",
              borderRadius: "var(--radius-md)",
              padding: "10px 14px",
              marginBottom: 20,
              fontSize: "0.85rem",
              color: "var(--success)",
            }}
          >
            Password updated! Signing you out…
          </div>
        )}

        <div className="auth-card" style={{ maxWidth: "100%" }}>
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label" htmlFor="old_password">
                Current Password
              </label>
              <input
                id="old_password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.old_password}
                onChange={set("old_password")}
                required
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="new_password">
                New Password
              </label>
              <input
                id="new_password"
                type="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.new_password}
                onChange={set("new_password")}
                required
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="new_password_confirm">
                Confirm New Password
              </label>
              <input
                id="new_password_confirm"
                type="password"
                className="form-input"
                placeholder="Repeat new password"
                value={form.new_password_confirm}
                onChange={set("new_password_confirm")}
                required
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Link
                to="/chat"
                className="btn btn--ghost"
                style={{ flex: 1, textAlign: "center" }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn btn--primary"
                style={{ flex: 1 }}
                disabled={loading || success}
              >
                {loading ? "Saving…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Danger zone */}
        <div
          style={{
            marginTop: 40,
            padding: "20px",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(224,92,107,.2)",
            background: "rgba(224,92,107,.05)",
          }}
        >
          <p
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--danger)",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: ".06em",
            }}
          >
            Danger Zone
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 14 }}>
            Logging out will end your current session.
          </p>
          <button className="btn btn--danger btn--sm" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
