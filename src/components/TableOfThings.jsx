// TableOfThings.jsx
import React, { useEffect, useState } from "react";
import { useVault } from "../VaultContext.jsx"; // ✅ use VaultContext

export default function TableOfThings({ backendUrl, folderPath, onSelect }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const { vaultHandle, isReady } = useVault(); // get vaultHandle from context

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      if (!isReady || !vaultHandle) {
        setDocs([]);
        return;
      }

      const entries = [];
      for await (const [name, entry] of vaultHandle.entries()) {
        if (entry.kind === "file" && name.endsWith("_meta.json")) {
          entries.push({
            id: name,
            name: name.replace("_meta.json", ".pdf"),
            status: "local",
            metaPath: name,
          });
        }
      }
      setDocs(entries);
    } catch (err) {
      console.error(err);
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [vaultHandle]); // refetch whenever vaultHandle changes

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
