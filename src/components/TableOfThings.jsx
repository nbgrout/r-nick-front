import React from "react";

export default function TableOfThings({ docs = [], onSelect }) {
  if (!docs.length) {
    return <div>No documents yet.</div>;
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Type</th>
          <th>Description</th>
          <th>Amount</th>
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
              <td>{doc.name}</td>
              <td>{doc.status}</td>
              <td>{meta.document_type || "—"}</td>
              <td title={meta.brief_description}>
                {meta.brief_description || "—"}
              </td>
              <td>
                {totalAmount > 0 ? `$${totalAmount.toFixed(2)}` : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
