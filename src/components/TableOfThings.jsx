// TableOfThings.jsx
import React, { useEffect, useState } from "react";

export default function TableOfThings({ backendUrl, onSelect }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/list-documents/`);
      const data = await res.json();
      setDocs(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // Optionally refresh every few seconds if files may change
    // const interval = setInterval(fetchDocuments, 5000);
    // return () => clearInterval(interval);
  }, []);

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
              {doc.pdf && (
                <a
                  href={`${backendUrl}/download/${encodeURIComponent(doc.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ marginLeft: 6 }}
                >
                  Open PDF
                </a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}