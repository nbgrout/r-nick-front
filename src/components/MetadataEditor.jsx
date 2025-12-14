import React, { useState, useEffect } from "react";

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

  const placeholderFields = [
    "client_first_name",
    "client_last_name",
    "summary",
    "author",
    "individuals",
    "date_authored",
    "earliest_date",
    "latest_date",
    "num_visits",
    "diagnoses",
    "doc_type",
    "audience",
    "total_medical_cost",
    "date_record_created",
  ];

  const entries =
    Object.keys(metadata).length > 0
      ? Object.entries(metadata)
      : placeholderFields.map((k) => [k, ""]);

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <h2 style={{ color: "var(--brand-purple)", margin: 0 }}>Brief</h2>
        <div style={{ fontSize: 13, color: "#666" }}>
          {saving ? "Saving..." : ""}
        </div>
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
                <textarea
                  value={v || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  value={v || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving || Object.keys(metadata).length === 0}
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
