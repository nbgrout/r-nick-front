console.log("TableOfThings rendered");

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
  <div style={{ background: "yellow", padding: 20 }}>
    TABLE OF THINGS IS HERE
  </div>
);
}
