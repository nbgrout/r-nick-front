// DocumentProcessor.jsx
import React, { useState, useEffect, useRef } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import logoSrc from "../assets/Logo.png";

export default function DocumentProcessor() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const folderInputRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    console.log("Backend URL:", BACKEND_URL);
  }, [BACKEND_URL]);

  /**
   * User selects a folder.
   * Browser gives us a list of files with RELATIVE paths.
   * We register those paths with the backend ledger.
   */
  const handleFolderSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setLoading(true);
    setStatus(`Registering ${files.length} documents…`);

    try {
      for (const file of files) {
        // Only register documents you care about
        if (!file.name.match(/\.(pdf|docx|txt)$/i)) continue;

        // This is the KEY VALUE you store
        // Example: "ClientA/Medical/ER_Visit.pdf"
        const relativePath = file.webkitRelativePath;

        await fetch(`${BACKEND_URL}/documents/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_path: relativePath,
            provider: "local",
          }),
        });
      }

      setStatus("Documents registered successfully.");
    } catch (err) {
      console.error(err);
      alert("Error registering documents");
      setStatus("Error");
    } finally {
      setLoading(false);
      e.target.value = ""; // allow re-selecting same folder
    }
  };

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <img src={logoSrc} className="header-logo" alt="logo" />
        <h1 className="header-title">Intelligence Factory</h1>
        <span className="header-version">(local data mode)</span>
      </header>

      <div className="container">
        {/* Status */}
        <div style={{ marginBottom: 10, fontSize: 14 }}>
          {loading ? "Working…" : status}
        </div>

        {/* Hidden folder picker */}
        <input
          ref={folderInputRef}
          type="file"
          webkitdirectory="true"
          multiple
          style={{ display: "none" }}
          onChange={handleFolderSelect}
        />

        {/* Main layout */}
        <div className="processor-grid">
          {/* Left stack */}
          <div className="left-stack">
            <div className="hero-row">
              <PortalScene
                wrapperSize={300}
                manWidth={220}
                spinDuration={6}
                shiftManPercent={0.15}
                onChooseFile={() => folderInputRef.current?.click()}
              />
            </div>

            {/* Instructional copy */}
            <div
              className="brief-card"
              style={{ fontSize: 13, color: "#555" }}
            >
              Choose a folder containing your documents.
              <br />
              Files remain in your own storage.
              <br />
              Intelligence Factory only indexes and analyzes them.
            </div>

            {/* Table driven by metadata ledger */}
            <TableOfThings backendUrl={BACKEND_URL} />

            {/* Metadata editor (now ledger-based) */}
            <div className="brief-card">
              <MetadataEditor backendUrl={BACKEND_URL} />
            </div>
          </div>

          {/* Right side (reserved for future previews / reports) */}
          <div>
            <div className="ocr-preview">
              <div className="ocr-title">Notes</div>
              <div style={{ fontSize: 13, color: "#666" }}>
                Select a document from the table to view details,
                summaries, and derived intelligence.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
