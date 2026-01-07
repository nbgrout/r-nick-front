// TableOfThings.jsx
import React, { useEffect, useState } from "react";
import { useVault } from "../VaultContext.jsx";

export default function TableOfThings({ backendUrl, onSelect }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const { listMetadataFiles, isReady } = useVault();

  useEffect(() => {
    if (!isReady) {
      setDocs([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const files = await listMetadataFiles();

        const entries = files.map((name) => ({
          id: name,
          name: name.replace("_meta.json", ".pdf"),
          status: "local",
          metaPath: name,
        }));

        setDocs(entries);
      } catch (err) {
        console.error("Failed to list metadata files:", err);
        setDocs([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isReady, listMetadataFiles]);

  if (!isReady) return <div>Select a vault to view documents.</div>;
  if (loading) return <div>Loading documents…</div>;
  if (!docs.length) return <div>No documents in this folder yet.</div>;

  return (
    <table style={{ width: "100%", marginTop: 12, borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {docs.map((doc) => (
          <tr key={doc.id} style={{ borderBottom: "1px solid #ccc" }}>
            <td>{doc.name}</td>
            <td>{doc.status}</td>
            <td>
              <button onClick={() => onSelect(doc)}>Edit</button>
              <a
                href={`${backendUrl}/download/${encodeURIComponent(doc.name)}`}
                target="_blank"
                rel="noreferrer"
                style={{ marginLeft: 6 }}
              >
                Open PDF
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
