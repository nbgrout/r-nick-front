import React, { useState, useEffect } from "react";
import { useVault } from "../VaultContext.jsx";

export default function MetadataEditor({ metadata, metaPath }) {
  const { writeFileAtPath, readFileAtPath, isReady } = useVault();
  const [localMeta, setLocalMeta] = useState(metadata);
  const [originalFilename, setOriginalFilename] = useState("");

  useEffect(() => {
    async function load() {
      const raw = await readFileAtPath(metaPath);
      const parsed = JSON.parse(raw);
      setLocalMeta(parsed.metadata);
      setOriginalFilename(parsed.original_filename);
    }
    load();
  }, [metaPath]);

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
    <div>
      <h3>Document Brief</h3>

      <input
        value={localMeta.document_type || ""}
        onChange={(e) =>
          setLocalMeta({ ...localMeta, document_type: e.target.value })
        }
        placeholder="Document type"
      />

      <textarea
        value={localMeta.brief_description || ""}
        onChange={(e) =>
          setLocalMeta({ ...localMeta, brief_description: e.target.value })
        }
        placeholder="Brief description"
      />

      <button onClick={save} disabled={!isReady}>
        Save Metadata
      </button>
    </div>
  );
}
