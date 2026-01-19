// TableOfThings.jsx
import React from "react";

export default function TableOfThings({ items = [], onSelect }) {
  if (!items.length) return <div>No items yet.</div>;

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
        {items.map((item) => {
          const meta = item.metadata || {};
          const type =
            item.item_type === "memo"
              ? "Memo"
              : meta.document_type || "—";
          const totalAmount = meta.total_bill ?? 0;

          return (
            <tr
              key={item.id}
              onClick={() => onSelect(item)}
              style={{ cursor: "pointer", borderBottom: "1px solid #ddd" }}
            >
              <td>{meta.title || item.name}</td>
              <td>{item.status || "ready"}</td>
              <td>{type}</td>
              <td title={meta.brief_description || ""}>
                {meta.brief_description || "—"}
              </td>
              <td>{totalAmount > 0 ? `$${totalAmount.toFixed(2)}` : "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

