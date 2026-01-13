import React, { useEffect, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------
  // Load contacts
  // -----------------------------
  async function loadContacts() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/contacts`);
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContacts();
  }, []);

  // -----------------------------
  // Add contact
  // -----------------------------
  async function addContact() {
    if (!name.trim() || !role.trim()) return;

    const payload = {
      name,
      role,
      emails: [],
      phones: [],
    };

    try {
      const res = await fetch(`${API_BASE}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const created = await res.json();
      setContacts((prev) => [...prev, created]);
      setName("");
      setRole("");
    } catch (err) {
      console.error(err);
      alert("Failed to create contact");
    }
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div style={{ padding: 16 }}>
      <h2>Contacts</h2>

      <div
        style={{
          marginBottom: 16,
          padding: 12,
          border: "1px solid #ddd",
          maxWidth: 400,
        }}
      >
        <h4>Add Contact</h4>

        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Role (client, adjuster, provider, etc.)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <button onClick={addContact}>Add</button>
      </div>

      <h4>Existing Contacts</h4>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {!loading && !contacts.length && (
        <div>No contacts yet.</div>
      )}

      <ul>
        {contacts.map((c) => (
          <li key={c.id}>
            <strong>{c.name}</strong> — {c.role}
            {c.organization ? ` (${c.organization})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
