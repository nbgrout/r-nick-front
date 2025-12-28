// TableOfThings.jsx
import React, { useEffect, useState } from "react";

export default function TableOfThings({ backendUrl, onSelect }) {
  const [docs, setDocs] = useState([]);

  const fetchDocs = async () => {
  if (!userFolder) return;
  const res = await fetch(`${backendUrl}/list-documents/?folder=${encodeURIComponent(userFolder)}`);
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
        {doc.name || "Unnamed"}
      </td>
      <td>{doc.status || "pending"}</td>
      <td>
        {doc.pdf ? (
          <a href={doc.pdf} target="_blank" rel="noopener noreferrer">
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