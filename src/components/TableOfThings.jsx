import React, { useEffect, useState, useMemo } from "react";

export default function TableOfThings({ backendUrl }) {
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState({});
  const [page, setPage] = useState(0);

  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [filters, setFilters] = useState({});

  const PAGE_SIZE = 20;

  useEffect(() => {
    fetch(`${backendUrl}/list-documents/`)
      .then(r => r.json())
      .then(setDocs)
      .catch(console.error);
  }, [backendUrl]);

  const toggle = (base) =>
    setSelected(s => ({ ...s, [base]: !s[base] }));

  const toggleSort = (key) => {
    setSort(prev => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: null, dir: "asc" };
    });
  };

  const filteredAndSorted = useMemo(() => {
    let rows = [...docs];

    // filtering
    rows = rows.filter(d => {
      return Object.entries(filters).every(([k, v]) => {
        if (!v) return true;
        if (k === "pdf") {
          return d.pdf.toLowerCase().includes(v.toLowerCase());
        }
        return String(d.meta?.[k] ?? "")
          .toLowerCase()
          .includes(v.toLowerCase());
      });
    });

    // sorting
    if (sort.key) {
      rows.sort((a, b) => {
        const av =
          sort.key === "pdf"
            ? a.pdf
            : String(a.meta?.[sort.key] ?? "");
        const bv =
          sort.key === "pdf"
            ? b.pdf
            : String(b.meta?.[sort.key] ?? "");

        return sort.dir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      });
    }

    return rows;
  }, [docs, filters, sort]);

  const pageDocs = filteredAndSorted.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  const download = async () => {
    const bases = Object.keys(selected).filter(k => selected[k]);
    if (!bases.length) return alert("No documents selected");

    const res = await fetch(`${backendUrl}/download-selected/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bases),
    });

    const { download_url } = await res.json();
    window.location.href = `${backendUrl}${download_url}`;
  };

  const metaKeys = docs[0] ? Object.keys(docs[0].meta) : [];

  return (
    <div className="brief-card" style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ margin: 0, color: "var(--brand-purple)" }}>
          Documents
        </h3>
        <button onClick={download}>Download Selected</button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th />
            <th onClick={() => toggleSort("pdf")} style={{ cursor: "pointer" }}>
              PDF {sort.key === "pdf" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
            </th>
            {metaKeys.map(k => (
              <th
                key={k}
                onClick={() => toggleSort(k)}
                style={{ cursor: "pointer" }}
              >
                {k}
                {sort.key === k ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>

          {/* FILTER ROW */}
          <tr>
            <th />
            <th>
              <input
                placeholder="filter"
                value={filters.pdf || ""}
                onChange={e =>
                  setFilters(f => ({ ...f, pdf: e.target.value }))
                }
              />
            </th>
            {metaKeys.map(k => (
              <th key={k}>
                <input
                  placeholder="filter"
                  value={filters[k] || ""}
                  onChange={e =>
                    setFilters(f => ({ ...f, [k]: e.target.value }))
                  }
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {pageDocs.map(d => (
            <tr key={d.base}>
              <td>
                <input
                  type="checkbox"
                  checked={!!selected[d.base]}
                  onChange={() => toggle(d.base)}
                />
              </td>
              <td>{d.pdf}</td>
              {metaKeys.map(k => (
                <td key={k}>{String(d.meta?.[k] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
        <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
          Prev
        </button>
        <button
          disabled={(page + 1) * PAGE_SIZE >= filteredAndSorted.length}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
        <span style={{ fontSize: 12, color: "#666" }}>
          Showing {filteredAndSorted.length} results
        </span>
      </div>
    </div>
  );
}
