// ============================================================
// src/pages/SignupPage.jsx
// ============================================================

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import "../styles/auth.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    identifier: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await api.signup(
        form.identifier,
        form.email,
        form.password,
        form.password_confirm,
      );
      navigate("/login");
    } catch (err) {
      if (err?.errors) {
        setErrors(err.errors.map((e) => e.msg));
      } else {
        setErrors([err?.message || "Something went wrong."]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__logo">murmur</div>
        <h1 className="auth-card__title">Create account</h1>
        <p className="auth-card__sub">Join and start chatting</p>

        {errors.length > 0 && (
          <div className="form-errors-box">
            {errors.map((e, i) => (
              <span key={i}>{e}</span>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label" htmlFor="identifier">
              Identifier
            </label>
            <input
              id="identifier"
              className="form-input"
              placeholder="yourhandle"
              value={form.identifier}
              onChange={set("identifier")}
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set("password")}
              required
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="password_confirm">
              Confirm Password
            </label>
            <input
              id="password_confirm"
              type="password"
              className="form-input"
              placeholder="Repeat password"
              value={form.password_confirm}
              onChange={set("password_confirm")}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-card__footer" style={{ marginTop: 6 }}>
          <Link to="/" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
