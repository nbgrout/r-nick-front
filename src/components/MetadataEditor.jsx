import React, { useState, useEffect } from "react";

/**
 * MetadataEditor (two-column stacked grid)
 * props: metaPath (url to load), backendUrl (save endpoint)
 *
 * Renders placeholders until metadata available; same save API as before.
 */
export default function MetadataEditor({ metaPath, backendUrl }) {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!metaPath) {
      setMetadata({});
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    fetch(metaPath)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch metadata");
        return r.json();
      })
      .then((data) => {
        setMetadata(data || {});
        setLoading(false);
      })
      .catch((e) => {
        setError("Failed to load metadata: " + e.message);
        setLoading(false);
      });
  }, [metaPath]);

  const handleChange = (key, value) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const deriveFilename = () => {
    const parts = metaPath?.split("/") || [];
    const f = parts[parts.length - 1] || "";
    return f.replace("_meta.json", "");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = { filename: deriveFilename(), ...metadata };
      const res = await fetch(`${backendUrl}/save_meta`, {
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

  // placeholder field order if none yet
  const placeholderFields = [
    "case_number",
    "date",
    "client_name",
    "opposing_party",
    "hearing_type",
    "location",
    "contact",
    "summary",
  ];

  const entries =
    Object.keys(metadata).length > 0
      ? Object.entries(metadata)
      : placeholderFields.map((k) => [k, ""]);

  // split into two columns visually by wrapping entries in grid
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={{ color: "var(--brand-purple)", margin: 0 }}>Metadata Editor</h2>
        <div style={{ fontSize: 13, color: "#666" }}>{saving ? "Saving..." : ""}</div>
      </div>

      {error && <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>}
      {loading && <div style={{ color: "#666", marginBottom: 8 }}>Loading metadata…</div>}

      <div className="metadata-grid">
        {entries.map(([k, v]) => {
          const key = k;
          const isSummary = key.toLowerCase() === "summary";
          return (
            <div className="field" key={key}>
              <label>{key.replaceAll("_", " ")}</label>
              {isSummary ? (
                <textarea value={v || ""} onChange={(e) => handleChange(key, e.target.value)} />
              ) : (
                <input type="text" value={v || ""} onChange={(e) => handleChange(key, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button onClick={handleSave} disabled={saving || Object.keys(metadata).length === 0} style={{ background: "var(--brand-purple)", color: "#fff", padding: "8px 12px", borderRadius: 8, border: "none" }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}