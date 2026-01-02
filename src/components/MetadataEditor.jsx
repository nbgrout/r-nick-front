// MetadataEditor.jsx
import React, { useState, useEffect } from "react";

export default function MetadataEditor({ metaPath, backendUrl }) {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load metadata whenever metaPath changes
useEffect(() => {
  if (!metaPath) return;

  setLoading(true);
  setError("");

  (async () => {
    try {
      const vault = await getVaultHandle();
      const text = await readFile(vault, metaPath);
      setMetadata(JSON.parse(text));
    } catch (e) {
      setError("Failed to load metadata: " + e.message);
    } finally {
      setLoading(false);
    }
  })();
}, [metaPath]);

  const handleChange = (key, value) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!metaPath) return;
    setSaving(true);
    setError("");
    try {
      const payload = { meta_path: metaPath, content: metadata };
      const res = await fetch(`${backendUrl}/documents/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Metadata saved!");
    } catch (e) {
      setError("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <h2 style={{ color: "var(--brand-purple)", margin: 0 }}>Brief</h2>
        <div style={{ fontSize: 13, color: "#666" }}>{saving ? "Saving..." : ""}</div>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
      {loading && <div style={{ color: "#666", marginBottom: 8 }}>Loading metadata…</div>}

      <div className="metadata-grid">
        {Object.entries(metadata).map(([key, value]) => {
          const isSummary = key.toLowerCase() === "summary";
          return (
            <div className="field" key={key}>
              <label>{key.replaceAll("_", " ")}</label>
              {isSummary ? (
                <textarea value={value || ""} onChange={(e) => handleChange(key, e.target.value)} />
              ) : (
                <input type="text" value={value || ""} onChange={(e) => handleChange(key, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving || !metaPath}
          style={{
            background: "var(--brand-purple)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
