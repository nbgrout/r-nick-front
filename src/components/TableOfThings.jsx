// TableOfThings.jsx
import React, { useEffect, useMemo, useState } from "react";

export default function TableOfThings({ backendUrl }) {
  const [docs, setDocs] = useState([]);
  const [sort, setSort] = useState({ key: "added_at", dir: "desc" });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch(`${backendUrl}/documents`)
      .then((r) => r.json())
      .then(setDocs)
      .catch(console.error);
  }, [backendUrl]);

  const toggleSort = (key) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const rows = useMemo(() => {
    let r = [...docs];

    if (filter) {
      r = r.filter((d) =>
        d.source.path.toLowerCase().includes(filter.toLowerCase()) ||
        (d.content?.summary || "").toLowerCase().includes(filter.toLowerCase())
      );
    }

    r.sort((a, b) => {
      const av =
        sort.key === "path"
          ? a.source.path
          : sort.key === "status"
          ? a.ingestion.status
          : a.ingestion.added_at;

      const bv =
        sort.key === "path"
          ? b.source.path
          : sort.key === "status"
          ? b.ingestion.status
          : b.ingestion.added_at;

      return sort.dir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return r;
  }, [docs, sort, filter]);

  return (
    <div className="brief-card">
      <h3 style={{ marginBottom: 8 }}>Documents</h3>

      <input
        placeholder="Filter by path or summary…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          width: "100%",
          marginBottom: 10,
          padding: 6,
          borderRadius: 6,
          border: "1px solid #ccc",
        }}
      />

      <table style={{ width: "100%", fontSize: 13 }}>
        <thead>
          <tr>
            <th onClick={() => toggleSort("path")}>Path</th>
            <th onClick={() => toggleSort("status")}>Status</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => (
            <tr key={d.id}>
              <td style={{ maxWidth: 240, wordBreak: "break-all" }}>
                {d.source.path}
              </td>
              <td>{d.ingestion.status}</td>
              <td style={{ maxWidth: 300 }}>
                {d.content?.summary
                  ? d.content.summary.slice(0, 120) + "…"
                  : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}