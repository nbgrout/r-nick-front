// TableOfThings.jsx
import React, { useEffect, useState } from "react";

export default function TableOfThings({ backendUrl }) {
  const [docs, setDocs] = useState([]);

  const fetchDocs = async () => {
    const res = await fetch(`${backendUrl}/list-documents/`);
    const data = await res.json();
    setDocs(data);
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="table-of-things">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(d => (
            <tr key={d.id}>
              <td><a href={d.pdf_url} target="_blank">{d.name}</a></td>
              <td>{d.metadata?.doc_type || ""}</td>
              <td>{d.metadata?.summary || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
