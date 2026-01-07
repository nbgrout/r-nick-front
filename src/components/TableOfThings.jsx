// TableOfThings.jsx
import React, { useState } from "react";

export default function TableOfThings({ backendUrl, docs, onSelect }) {
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(0);

  if (!docs || !docs.length) return <div>No documents in this folder yet.</div>;

  const pageCount = Math.ceil(docs.length / ITEMS_PER_PAGE);

  const currentDocs = docs.slice(
    currentPage * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const goToPage = (pageIndex) => {
    if (pageIndex < 0 || pageIndex >= pageCount) return;
    setCurrentPage(pageIndex);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentDocs.map((doc) => (
            <tr key={doc.id} style={{ borderBottom: "1px solid #ccc" }}>
              <td>{doc.name}</td>
              <td>{doc.status}</td>
              <td>
                <button onClick={() => onSelect(doc)}>Edit</button>
                {doc.status === "local" && (
                  <a
                    href={`${backendUrl}/download/${encodeURIComponent(
                      doc.name
                    )}`}
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

      {/* Pagination buttons */}
      {pageCount > 1 && (
        <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}>
            Prev
          </button>
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              style={{
                fontWeight: i === currentPage ? "bold" : "normal",
                textDecoration: i === currentPage ? "underline" : "none",
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

