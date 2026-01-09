import React, { useState, useEffect, useRef } from "react";
import { useVault } from "../VaultContext.jsx";

export default function MetadataEditor({ metadata: initialMetadata, metaPath, status, backendUrl, fileName }) {
  const { writeFile, isReady } = useVault();
  const [metadata, setMetadata] = useState(initialMetadata || {});
  const [saving, setSaving] = useState(false);
  const summaryRef = useRef(null);
  const PORTAL_HEIGHT = 300;

  useEffect(() => {
    setMetadata(initialMetadata || {});
  }, [initialMetadata]);

  useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.style.height = "auto";
      summaryRef.current.style.height = Math.min(
        summaryRef.current.scrollHeight,
        PORTAL_HEIGHT
      ) + "px";
    }
  }, [metadata.summary]);

  const handleChange = (field, value) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!metaPath) return;
    setSaving(true);
    try {
      if (!isReady) throw new Error("Vault not selected");
      await writeFile(metaPath, JSON.stringify(metadata, null, 2));
      alert("Metadata saved successfully.");
    } catch (err) {
      console.error("Failed to save metadata:", err);
      alert(err.message || "Failed to save metadata");
    } finally {
      setSaving(false);
    }
  };

  if (!metadata) return <div>Loading metadata…</div>;

  return (
    <div className="metadata-editor" style={{ marginTop: 12 }}>
      <h3>Metadata Editor ({status})</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Object.entries(metadata).map(([key, value]) => {
          if (key === "summary") {
            return (
              <div key={key} style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ fontWeight: "bold" }}>{key}</label>
                <textarea
                  ref={summaryRef}
                  value={value || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{
                    width: "100%",
                    minHeight: 80,
                    maxHeight: PORTAL_HEIGHT,
                    overflowY: "auto",
                    resize: "none",
                    padding: 6,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    fontSize: 14,
                    lineHeight: "1.4em",
                  }}
                />
              </div>
            );
          }

          return (
            <div key={key} style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ fontWeight: "bold" }}>{key}</label>
              <input
                type="text"
                value={value || ""}
                onChange={(e) => handleChange(key, e.target.value)}
                style={{
                  padding: 4,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  fontSize: 14,
                }}
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !isReady}
        style={{
          marginTop: 12,
          padding: "6px 12px",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
