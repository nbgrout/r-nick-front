import React, { useState, useEffect } from "react";
import { useVault } from "../VaultContext.jsx";

export default function MetadataEditor({ metadata, metaPath }) {
  const { writeFileAtPath, isReady } = useVault();
  const [localMeta, setLocalMeta] = useState(metadata);

  useEffect(() => setLocalMeta(metadata), [metadata]);

  if (!localMeta) return null;

  const save = async () => {
    await writeFileAtPath(metaPath, JSON.stringify(localMeta, null, 2));
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
      />

      <textarea
        value={localMeta.brief_description || ""}
        onChange={(e) =>
          setLocalMeta({ ...localMeta, brief_description: e.target.value })
        }
      />

      <button onClick={save} disabled={!isReady}>
        Save Metadata
      </button>
    </div>
  );
}
