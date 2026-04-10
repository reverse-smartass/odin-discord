// ============================================================
// src/pages/HomePage.jsx
// ============================================================

import { Link } from "react-router-dom";
import "../styles/auth.css";

export default function HomePage() {
  return (
    <div className="auth-shell">
      <div className="home-hero">
        <span className="home-hero__eyebrow">Private group chat</span>
        <h1 className="home-hero__title">
          Talk without<br /><span>the noise.</span>
        </h1>
        <p className="home-hero__sub">
          Murmur is a minimal, private space for you and the people you actually want to talk to.
        </p>
        <div className="home-hero__cta">
          <Link to="/signup" className="btn btn--primary">Get started</Link>
          <Link to="/login" className="btn btn--ghost">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
