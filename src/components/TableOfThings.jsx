// TableOfThings.jsx
import React, { useEffect, useState } from "react";

export default function TableOfThings({ backendUrl, onSelect }) {
  const [docs, setDocs] = useState([]);

  const fetchDocs = async () => {
    const res = await fetch(`${backendUrl}/documents`);
    const data = await res.json();
    setDocs(data);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ width: "30%", wordWrap: "break-word" }}>Name</th>
          <th>Status</th>
          <th>PDF</th>
        </tr>
      </thead>
      <tbody>
        {docs.map((doc) => (
          <tr
            key={doc.id}
            onClick={() => onSelect && onSelect(doc)}
            style={{ cursor: "pointer" }}
          >
            <td style={{ wordWrap: "break-word", maxWidth: 250 }}>
              {doc.source?.path?.split("/").pop() || "Unnamed"}
            </td>
            <td>{doc.ingestion?.status || "pending"}</td>
            <td>
              {doc.source?.path ? (
                <a href={`file:///${doc.source.path}`} target="_blank">
                  Open PDF
                </a>
              ) : (
                "N/A"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}