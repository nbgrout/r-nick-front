// TableOfThings.jsx
import React, { useEffect, useState } from "react";

export default function TableOfThings({ backendUrl, folderPath, onSelect }) {
  const [docs, setDocs] = useState([]);

  const fetchDocs = async () => {
  if (!folderPath) return; // do nothing if folderPath not set
  try {
    const res = await fetch(
      `${backendUrl}/list-documents/?folder=${encodeURIComponent(folderPath)}`
    );
    if (!res.ok) {
      console.error("Failed to fetch documents", res.status);
      setDocs([]);
      return;
    }
    const data = await res.json();
    setDocs(data);
  } catch (err) {
    console.error("Error fetching documents", err);
    setDocs([]);
  }
};

  useEffect(() => {
  fetchDocs();
}, [folderPath]); // <-- reload whenever folderPath changes

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