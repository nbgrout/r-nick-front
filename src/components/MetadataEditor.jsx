//MetadataEditor.jsx
import React, { useState, useEffect, useRef } from "react";
import { useVault } from "../VaultContext.jsx";

export default function MetadataEditor({ metadata, metaPath, status }) {
  const { writeFile, isReady } = useVault();
  const [localMeta, setLocalMeta] = useState(metadata);

  useEffect(() => setLocalMeta(metadata), [metadata]);

  const save = async () => {
    await writeFile(metaPath, JSON.stringify(localMeta, null, 2));
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

      <section>
        <h4>Critical Facts</h4>
        {(localMeta.critical_facts || []).map((fact, i) => (
          <div key={i}>
            <input
              value={fact.object}
              onChange={(e) => {
                const facts = [...localMeta.critical_facts];
                facts[i].object = e.target.value;
                setLocalMeta({ ...localMeta, critical_facts: facts });
              }}
            />
          </div>
        ))}
      </section>

      <section>
        <h4>Financial Items</h4>
        {(localMeta.financial_items || []).map((f, i) => (
          <div key={i}>
            <input value={f.amount} readOnly />
            <span>{f.type}</span>
          </div>
        ))}
      </section>

      <button onClick={save} disabled={!isReady}>
        Save Metadata
      </button>
    </div>
  );
}
