// ============================================================
// src/components/EditDisplayNameModal.jsx
// ============================================================

import { useState } from "react";
import Modal from "./Modal";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { useToast } from "./Toast";
import "../styles/auth.css";

export default function EditDisplayNameModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [identifier, setIdentifier] = useState(user.identifier || "");
  const [email, setEmail] = useState(user.email || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      const { updateduser } = await api.editUser(user.id, { displayName, identifier, email });
      updateUser({
        displayName: updateduser.displayName,
        identifier: updateduser.identifier,
        email: updateduser.email,
      });
      toast("Profile updated!");
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors.map((e) => e.msg));
      else setErrors(["Something went wrong."]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {errors.length > 0 && (
          <div className="form-errors-box">
            {errors.map((e, i) => <span key={i}>{e}</span>)}
          </div>
        )}
        <div className="form-field">
          <label className="form-label">Display Name</label>
          <input
            className="form-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How others see you"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Identifier</label>
          <input
            className="form-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="@handle"
          />
        </div>
        <div className="form-field">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" style={{ flex: 1 }} disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
