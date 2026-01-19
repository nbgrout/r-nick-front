// MetadataEditor.jsx
import React, { useState, useEffect } from "react";
import { useVault } from "../VaultContext.jsx";

const METADATA_FIELDS = [
  { key: "title", label: "Title" },
  { key: "type", label: "Type" },
  { key: "brief_description", label: "Brief Description", multiline: true },
  { key: "client_name", label: "Client Name" },
  { key: "activity_date", label: "Activity Date" },
  { key: "facts", label: "Facts (one per line)", multiline: true },
];

export default function MetadataEditor({ metaPath }) {
  const { readFileAtPath, writeFileAtPath, isReady } = useVault();
  const [metadata, setMetadata] = useState({});
  const [factsText, setFactsText] = useState("");
  const [originalFilename, setOriginalFilename] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isReady || !metaPath) return;
    let cancelled = false;

    async function load() {
      try {
        const raw = await readFileAtPath(metaPath);
        if (cancelled) return;

        const parsed = JSON.parse(raw);
        setOriginalFilename(parsed.source?.original_filename || "");
        const md = parsed.metadata || {};
        setMetadata(md);

        // Convert facts array → text
        if (Array.isArray(md.facts)) {
          setFactsText(md.facts.join("\n"));
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

  const save = async () => {
    const cleanedFacts = factsText
      .split("\n")
      .map((f) => f.trim())
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

  if (!loaded) return <div>Loading metadata...</div>;

  return (
    <div style={{ padding: 12 }}>
      <h3>Document Brief</h3>
      {METADATA_FIELDS.map((field) => {
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
                onChange={(e) => setFactsText(e.target.value)}
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
                onChange={(e) =>
                  setMetadata({ ...metadata, [field.key]: e.target.value })
                }
              />
            ) : (
              <input
                type="text"
                style={{ width: "100%" }}
                value={value}
                onChange={(e) =>
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
