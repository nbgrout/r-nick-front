import React from "react";

export default function TableOfThings({ docs = [], onSelect }) {
  if (!docs.length) {
    return <div>No documents yet.</div>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Bates</th>
          <th>Type</th>
          <th>Description</th>
          <th>Date</th>
          <th>Amount</th>
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        {docs.map((doc) => {
          const meta = doc.metadata || {};
          const totalAmount = (meta.financial_items || []).reduce(
            (sum, f) => sum + (f.amount || 0),
            0
          );

          return (
            <tr
              key={doc.id}
              onClick={() => onSelect(doc)}
              style={{ cursor: "pointer", borderBottom: "1px solid #ddd" }}
            >
              <td>{meta.bates_name || "—"}</td>
              <td>{meta.document_type || "—"}</td>
              <td title={meta.brief_description}>
                {meta.brief_description || "—"}
              </td>
              <td>{meta.date_document_written || "—"}</td>
              <td>
                {totalAmount > 0 ? `$${totalAmount.toFixed(2)}` : "—"}
              </td>
              <td>
                {(meta.tags || []).map((t) => (
                  <span key={t} style={{ marginRight: 4 }}>
                    {t}
                  </span>
                ))}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
