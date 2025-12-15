import React, { useState, useEffect } from "react";

export default function MetadataEditor({ metaPath }) {
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!metaPath) return;
    fetch(metaPath).then(r => r.json()).then(setMeta);
  }, [metaPath]);

  if (!meta) return <div>No metadata</div>;

  const update = (path, value) => {
    setMeta(prev => {
      const copy = structuredClone(prev);
      let obj = copy;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return copy;
    });
  };

  return (
    <div className="metadata-grid">
      <h2>Brief</h2>

      <label>Client First</label>
      <input value={meta.client_name?.first || ""}
        onChange={e => update(["client_name", "first"], e.target.value)} />

      <label>Client Last</label>
      <input value={meta.client_name?.last || ""}
        onChange={e => update(["client_name", "last"], e.target.value)} />

      <label>Date Written</label>
      <input value={meta.date_written || ""} />

      <label>Author</label>
      <input value={meta.author || ""} />

      <label>Document Type</label>
      <select value={meta.document_type}
        onChange={e => update(["document_type"], e.target.value)}>
        {["medical report","bill","police report","intake","correspondence","other"]
          .map(t => <option key={t}>{t}</option>)}
      </select>

      <label>Summary</label>
      <textarea
        value={(meta.summary || []).join("\n")}
        onChange={e => update(["summary"], e.target.value.split("\n"))}
      />
    </div>
  );
}
