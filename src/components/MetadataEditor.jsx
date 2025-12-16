// MetadataEditor.jsx
import React, { useState, useEffect } from "react";

export default function MetadataEditor({ metaPath, backendUrl }) {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  // Load metadata
  useEffect(() => {
    if (!metaPath) return;

    setLoading(true);
    setError("");
    fetch(metaPath)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch metadata");
        return r.json();
      })
      .then((data) => {
        setMetadata(data || {});
        setLoading(false);
      })
      .catch((e) => {
        setError("Failed to load metadata: " + e.message);
        setLoading(false);
      });
  }, [metaPath]);

  // Sort and filter entries
  const entries = Object.entries(metadata)
    .filter(([k, v]) =>
      k.toLowerCase().includes(filterText.toLowerCase()) ||
      (v && v.toString().toLowerCase().includes(filterText.toLowerCase()))
    )
    .sort(([aKey, aVal], [bKey, bVal]) => {
      if (!sortField) return 0;
      if (aKey !== sortField) return 0;
      const compA = (aVal || "").toString();
      const compB = (bVal || "").toString();
      if (compA < compB) return sortAsc ? -1 : 1;
      if (compA > compB) return sortAsc ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const downloadItem = (key, value) => {
    const blob = new Blob([JSON.stringify({ [key]: value }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${key}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p>Loading metadata...</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!metadata || Object.keys(metadata).length === 0)
    return <p>No metadata available.</p>;

  return (
    <div>
      <h2 style={{ color: "var(--brand-purple)" }}>Metadata Table</h2>

      <input
        type="text"
        placeholder="Filter..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        style={{ marginBottom: 10, padding: 4, width: "100%" }}
      />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              style={{ cursor: "pointer", borderBottom: "1px solid #ccc" }}
              onClick={() => toggleSort("key")}
            >
              Field {sortField === "key" ? (sortAsc ? "▲" : "▼") : ""}
            </th>
            <th
              style={{ cursor: "pointer", borderBottom: "1px solid #ccc" }}
              onClick={() => toggleSort("value")}
            >
              Value {sortField === "value" ? (sortAsc ? "▲" : "▼") : ""}
            </th>
            <th style={{ borderBottom: "1px solid #ccc" }}>Download</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td
                style={{
                  padding: 6,
                  borderBottom: "1px solid #eee",
                  fontWeight: "bold",
                }}
              >
                {key}
              </td>
              <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>
                {value?.toString()}
              </td>
              <td style={{ padding: 6, borderBottom: "1px solid #eee" }}>
                <button
                  onClick={() => downloadItem(key, value)}
                  style={{
                    background: "var(--brand-purple)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                >
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
