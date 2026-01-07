// DocumentProcessor.jsx
import React, { useState, useRef } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import logoSrc from "../assets/Logo.png";
import { useVault } from "../VaultContext";

export default function DocumentProcessor() {
  const [ocrText, setOcrText] = useState("");
  const [metaPath, setMetaPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const { chooseVault, isReady, writeFile } = useVault();

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "";
  const dropRef = useRef(null);

  // Table refresh reference
  const tableRefetchRef = useRef(null);

  const handleChooseFolder = async () => {
    try {
      await chooseVault();
    } catch (err) {
      console.error("Vault selection failed:", err);
      alert(err.message || "Vault selection failed");
    }
  };

  const handleFile = async (file) => {
    setLoading(true);
    try {
      // Upload PDF for OCR
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("OCR upload failed");
      }

      const uploadData = await uploadRes.json();
      const fullText = uploadData.ocr_text;
      setOcrText(fullText);

      // Save OCR text locally
      const ocrFilename = file.name.replace(/\.pdf$/i, "_ocr.txt");
      await writeFile(ocrFilename, fullText);

      // Extract metadata
      const metaForm = new FormData();
      metaForm.append("text", fullText);

      const metaRes = await fetch(`${BACKEND_URL}/extract-meta/`, {
        method: "POST",
        body: metaForm,
      });

      if (!metaRes.ok) {
        throw new Error("Metadata extraction failed");
      }

      const metaJson = await metaRes.json();
      const metadata = metaJson.metadata;

      // Write metadata locally
      const metaFilename = file.name.replace(/\.pdf$/i, "_meta.json");
      await writeFile(metaFilename, JSON.stringify(metadata, null, 2));

      setMetaPath(metaFilename);
      setSelectedDoc({
        name: file.name,
        metaPath: metaFilename,
        metadata,
      });

      // Refresh the table automatically
      if (tableRefetchRef.current) {
        tableRefetchRef.current();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Error processing file");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <>
      <header className="app-header">
        <img src={logoSrc} className="header-logo" alt="logo" />
        <h1 className="header-title">R. Nick</h1>
      </header>

      <div className="container">
        {/* Vault selection */}
        <div className="folder-input" style={{ marginBottom: 10 }}>
          <label>Vault Folder (for PDFs, metadata, OCR):</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              value={isReady ? "Vault selected" : ""}
              readOnly
              style={{ flex: 1 }}
              placeholder="No vault selected"
            />
            <button onClick={handleChooseFolder}>Choose Vault…</button>
          </div>
        </div>

        <div
          className="processor-grid"
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="left-stack">
            <PortalScene
              wrapperSize={300}
              manWidth={220}
              spinDuration={6}
              shiftManPercent={0.15}
              onChooseFile={() =>
                document.getElementById("fileInput").click()
              }
            />

            <TableOfThings
              backendUrl={BACKEND_URL}
              onSelect={(doc) => {
                setMetaPath(doc.metaPath);
                setSelectedDoc(doc);
              }}
              onRefetch={(refetch) => {
                tableRefetchRef.current = refetch;
              }}
            />

            {metaPath && (
              <MetadataEditor
                metaPath={metaPath}
                backendUrl={BACKEND_URL}
                key={metaPath}
              />
            )}
          </div>

          <div className="ocr-preview">
            <div className="ocr-title">Extracted Text</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {loading ? "Processing…" : ocrText || "Drop PDF to start."}
            </pre>
          </div>
        </div>

        <input
          type="file"
          id="fileInput"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) =>
            e.target.files.length && handleFile(e.target.files[0])
          }
        />
      </div>
    </>
  );
}