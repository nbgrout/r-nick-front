// MetadataEditor.jsx
import React, { useState, useEffect } from "react";
import { useVault } from "../VaultContext.jsx";

const METADATA_FIELDS = [
  { key: "document_type", label: "Document Type" },
  { key: "brief_description", label: "Brief Description", multiline: true },
  { key: "client_name", label: "Client Name" },
  { key: "activity_date", label: "Activity Date" },
  { key: "total_bill", label: "Total Amount ($)" },
  { key: "facts", label: "Facts (one per line)", multiline: true },
];


export default function MetadataEditor({ metaPath }) {
  const { readFileAtPath, writeFileAtPath, isReady } = useVault();

  const [loaded, setLoaded] = useState(false);
  const [originalFilename, setOriginalFilename] = useState("");
  const [metadata, setMetadata] = useState({});
  const [factsText, setFactsText] = useState("");

  useEffect(() => {
    if (!isReady || !metaPath) return;

    let cancelled = false;

    async function load() {
      try {
        const raw = await readFileAtPath(metaPath);
        if (cancelled) return;

        const parsed = JSON.parse(raw);

        setOriginalFilename(parsed.original_filename || "");
        setMetadata(parsed.metadata || {});

        // IMPORTANT: convert array → editable text
        if (Array.isArray(parsed.metadata?.facts)) {
          setFactsText(parsed.metadata.facts.join("\n"));
        } else {
          setFactsText("");
        }

        setLoaded(true);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    }

    load();
    return () => (cancelled = true);
  }, [metaPath, isReady]);

  if (!loaded) return null;

  const save = async () => {
    const cleanedFacts = factsText
      .split("\n")
      .map(f => f.trim())
      .filter(Boolean);

    const wrapped = {
      schema_version: 1,
      original_filename: originalFilename,
      status: "ready",
      metadata: {
        ...metadata,
        facts: cleanedFacts,
      },
    };

    await writeFileAtPath(metaPath, JSON.stringify(wrapped, null, 2));
    alert("Saved");
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>Document Brief</h3>

      {METADATA_FIELDS.map(field => {
        if (field.key === "total_bill") {
  const value = metadata.total_bill ?? "";

  return (
    <div key="total_bill" style={{ marginBottom: 12 }}>
      <label style={{ fontWeight: "bold", display: "block" }}>
        {field.label}
      </label>
      <input
        type="number"
        step="0.01"
        style={{ width: "100%" }}
        value={value}
        onChange={e =>
          setMetadata({
            ...metadata,
            total_bill:
              e.target.value === ""
                ? 0
                : Number(e.target.value),
          })
        }
      />
    </div>
  );
}

        if (field.key === "facts") {
          return (
            <div key="facts" style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: "bold", display: "block" }}>
                {field.label}
              </label>
              <textarea
                rows={6}
                style={{ width: "100%" }}
                value={factsText}
                onChange={e => setFactsText(e.target.value)}
              />
            </div>
          );
        }

        const value = metadata[field.key] ?? "";

        return (
          <div key={field.key} style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: "bold", display: "block" }}>
              {field.label}
            </label>

            {field.multiline ? (
              <textarea
                rows={3}
                style={{ width: "100%" }}
                value={value}
                onChange={e =>
                  setMetadata({ ...metadata, [field.key]: e.target.value })
                }
              />
            ) : (
              <input
                type="text"
                style={{ width: "100%" }}
                value={value}
                onChange={e =>
                  setMetadata({ ...metadata, [field.key]: e.target.value })
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
