import React, { useState, useEffect } from "react";
import { useVault } from "../VaultContext.jsx";

export default function MetadataEditor({ metadata, metaPath }) {
  const { writeFileAtPath, isReady } = useVault();
  const [localMeta, setLocalMeta] = useState(metadata || {});

  useEffect(() => {
    setLocalMeta(metadata || {});
  }, [metadata]);

  const save = async () => {
    await writeFileAtPath(metaPath, JSON.stringify(localMeta, null, 2));
    alert("Saved");
  };

  if (!localMeta) return null;

  return (
    <div>
      <h3>Document Brief</h3>

      <section>
        <h4>Context</h4>
        <input
          value={localMeta.document_type || ""}
          onChange={(e) =>
            setLocalMeta({ ...localMeta, document_type: e.target.value })
          }
        />
        <input
          value={localMeta.document_role || ""}
          onChange={(e) =>
            setLocalMeta({ ...localMeta, document_role: e.target.value })
          }
        />
      </section>

      <section>
        <h4>Summary</h4>
        <textarea
          value={localMeta.brief_description || ""}
          onChange={(e) =>
            setLocalMeta({ ...localMeta, brief_description: e.target.value })
          }
        />
      </section>

      <button onClick={save} disabled={!isReady}>
        Save Metadata
      </button>
    </div>
  );
}
