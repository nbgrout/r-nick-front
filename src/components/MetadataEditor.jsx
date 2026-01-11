//MetadataEditor.jsx
import React, { useState, useEffect } from "react";
import { useVault } from "../VaultContext.jsx";

const METADATA_FIELDS = [
  { key: "document_type", label: "Document Type" },
  { key: "document_role", label: "Document Role" },
  { key: "date_document_written", label: "Date Document Written" },
  { key: "author", label: "Author / Writer" },
  { key: "audience", label: "Intended Audience" },
  { key: "one_sentence_summary", label: "One-Sentence Summary", multiline: true },
  { key: "brief_description", label: "Brief Description", multiline: true },
  { key: "critical_facts", label: "Critical Facts", multiline: true },
  { key: "tags", label: "Tags (comma separated)" }
];


export default function MetadataEditor({ metadata, metaPath }) {
  const { writeFileAtPath, readFileAtPath, isReady } = useVault();
  const [localMeta, setLocalMeta] = useState(metadata);
  const [originalFilename, setOriginalFilename] = useState("");

  useEffect(() => {
  if (!isReady || !metaPath) return;

  let cancelled = false;

  async function load() {
    try {
      const raw = await readFileAtPath(metaPath);
      if (cancelled) return;

      const parsed = JSON.parse(raw);
      setLocalMeta(parsed.metadata);
      setOriginalFilename(parsed.original_filename);
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  }

  load();

  return () => {
    cancelled = true;
  };
}, [metaPath, isReady]);

  if (!localMeta) return null;

  const save = async () => {
    const wrapped = {
      schema_version: 1,
      original_filename: originalFilename,
      status: "ready",
      metadata: localMeta
    };

    await writeFileAtPath(metaPath, JSON.stringify(wrapped, null, 2));
    alert("Saved");
  };

  return (
  <div style={{ padding: 12 }}>
    <h3>Document Brief</h3>

    {METADATA_FIELDS.map((field) => {
      const value = localMeta[field.key] ?? "";

      return (
        <div key={field.key} style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 4
            }}
          >
            {field.label}
          </label>

          {field.multiline ? (
            <textarea
              value={
                Array.isArray(value)
                  ? value.join("\n")
                  : value
              }
              rows={field.key === "critical_facts" ? 4 : 3}
              style={{ width: "100%" }}
              onChange={(e) => {
                let newValue = e.target.value;
                if (field.key === "tags") {
                  newValue = newValue
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                }
                setLocalMeta({
                  ...localMeta,
                  [field.key]: newValue
                });
              }}
            />
          ) : (
            <input
              type="text"
              value={value}
              style={{ width: "100%" }}
              onChange={(e) =>
                setLocalMeta({
                  ...localMeta,
                  [field.key]: e.target.value
                })
              }
            />
          )}
        </div>
      );
    })}

    <button onClick={save} disabled={!isReady}>
      Save Metadata
    </button>
  </div>
);

}
