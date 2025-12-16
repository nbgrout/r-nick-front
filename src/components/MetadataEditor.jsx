// MetadataEditor.jsx
import React, { useState, useEffect, useMemo } from "react";

const FIELD_ORDER = [
  "client_name",
  "date_processed",
  "date_written",
  "people_and_contacts",
  "document_type",
  "author",
  "audience",
  "activity_date_range",
  "one_sentence_description",
  "critical_facts",
];

const TEXTAREA_FIELDS = new Set([
  "people_and_contacts",
  "one_sentence_description",
  "critical_facts",
]);

export default function MetadataEditor({ metaPath, backendUrl }) {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------
  // Load metadata
  // -----------------------------
  useEffect(() => {
    if (!metaPath) {
      setMetadata({});
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(metaPath)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch metadata");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) {
          setMetadata(data || {});
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError("Failed to load metadata: " + e.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [metaPath]);

  // -----------------------------
  // Derived entries (stable)
  // -----------------------------
  const entries = useMemo(() => {
    const source =
      metadata && Object.keys(metadata).length > 0
        ? metadata
        : Object.fromEntries(FIELD_ORDER.map((k) => [k, ""]));

    return FIELD_ORDER.map((field) => [
      field,
      source[field] ?? "",
    ]);
  }, [metadata]);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleChange = (field, value) => {
    setMetadata((prev) => ({
      ...(prev || {}),
      [field]: value,
    }));
  };

  const deriveFilename = () => {
    if (!metaPath) return "";
    const parts = metaPath.split("/");
    const file = parts[parts.length - 1] || "";
    return file.replace("_meta.json", "");
  };

  const handleSave = async () => {
    if (!backendUrl) {
      setError("Backend URL not configured");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        filename: deriveFilename(),
        ...metadata,
      };

      const res = await fetch(`${backendUrl}/save_meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      alert("Metadata saved!");
    } catch (e) {
      setError("Save failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
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
        <h2 style={{ color: "var(--brand-purple)", margin: 0 }}>
          Brief
        </h2>
        <div style={{ fontSize: 13, color: "#666" }}>
          {saving ? "Saving…" : ""}
        </div>
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: 8 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: "#666", marginBottom: 8 }}>
          Loading metadata…
        </div>
      )}

      <div className="metadata-grid">
        {entries.map(([field, value]) => {
          const isTextarea = TEXTAREA_FIELDS.has(field);

          return (
            <div className="field" key={field}>
              <label>{field.replaceAll("_", " ")}</label>

              {isTextarea ? (
                <textarea
                  value={value}
                  onChange={(e) =>
                    handleChange(field, e.target.value)
                  }
                />
              ) : (
                <input
                  type="text"
                  value={value}
                  onChange={(e) =>
                    handleChange(field, e.target.value)
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 12,
        }}
      >
        <button
          onClick={handleSave}
          disabled={
            saving || Object.keys(metadata || {}).length === 0
          }
          style={{
            background: "var(--brand-purple)",
            color: "#fff",
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
          }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
