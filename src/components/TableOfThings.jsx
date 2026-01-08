// TableOfThings.jsx
import React, { useState } from "react";

export default function TableOfThings({ backendUrl, docs = [], onSelect }) {
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(0);

  if (!docs.length) {
    return <div>No documents in this folder yet.</div>;
  }

  const pageCount = Math.ceil(docs.length / ITEMS_PER_PAGE);

  const currentDocs = docs.slice(
    currentPage * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page < 0 || page >= pageCount) return;
    setCurrentPage(page);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left" style={{ width: "55%" }}>Name</th>
            <th align="left" style={{ width: "15%" }}>Status</th>
            <th align="left" style={{ width: "30%" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {currentDocs.map((doc) => (
            <tr key={doc.id} style={{ borderBottom: "1px solid #ccc" }}>
              <td
                title={doc.name}
                style={{
                  maxWidth: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontWeight: 600,
                }}
              >
                {doc.name}
              </td>

              <td>{doc.status}</td>

              <td>
                <button onClick={() => onSelect(doc)}>Edit</button>

                <a
                  href={
                    doc.status === "local"
                      ? `${backendUrl}/download/${encodeURIComponent(
                          doc.metadata?.filename || doc.name
                        )}`
                      : "#"
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    marginLeft: 6,
                    pointerEvents: doc.status === "local" ? "auto" : "none",
                    opacity: doc.status === "local" ? 1 : 0.4,
                  }}
                >
                  Open PDF
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pageCount > 1 && (
        <div style={{ marginTop: 8, display: "flex", gap: 4 }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Prev
          </button>

          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              style={{ fontWeight: i === currentPage ? "bold" : "normal" }}
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
