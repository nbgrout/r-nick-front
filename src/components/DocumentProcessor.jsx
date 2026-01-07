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
  const [docsInTable, setDocsInTable] = useState([]); // Track all docs including processing

  const { chooseVault, isReady, writeFile } = useVault();
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "";
  const dropRef = useRef(null);

  const handleChooseFolder = async () => {
    try {
      await chooseVault();
    } catch (err) {
      console.error("Vault selection failed:", err);
      alert(err.message || "Vault selection failed");
    }
  };

const handleFile = async (file) => {
  // Step 0 — check vault is ready
  if (!isReady) {
    alert("Please select a vault first");
    return;
  }

  // Step 1 — immediately show in table as "processing"
  const newDoc = {
    id: file.name + "-" + Date.now(), // unique ID
    name: file.name,
    status: "processing",
    metaPath: null,
  };
  setDocsInTable((prev) => [...prev, newDoc]); // trigger table render

  setLoading(true);
  try {
    // Step 2 — upload PDF for OCR
    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) throw new Error("OCR upload failed");
    const uploadData = await uploadRes.json();
    const ocrText = uploadData.ocr_text;
    setOcrText(ocrText);

    // Step 3 — extract metadata
    const metaForm = new FormData();
    metaForm.append("text", ocrText);

    const metaRes = await fetch(`${BACKEND_URL}/extract-meta/`, {
      method: "POST",
      body: metaForm,
    });

    if (!metaRes.ok) throw new Error("Metadata extraction failed");
    const metadata = (await metaRes.json()).metadata;

    // Step 4 — save metadata locally
    const metaFilename = file.name.replace(/\.pdf$/i, "_meta.json");
    await writeFile(metaFilename, JSON.stringify(metadata, null, 2));

    // Step 5 — update table row to "local"
    setDocsInTable((prev) =>
      prev.map((doc) =>
        doc.id === newDoc.id
          ? { ...doc, status: "local", metaPath: metaFilename, metadata }
          : doc
      )
    );
  } catch (err) {
    console.error(err);
    // Step 6 — mark table row as error
    setDocsInTable((prev) =>
      prev.map((doc) =>
        doc.id === newDoc.id ? { ...doc, status: "error" } : doc
      )
    );
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
        <div className="folder-input" style={{ marginBottom: 10 }}>
          <label>Vault Folder (for PDFs and metadata):</label>
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
              onChooseFile={() => document.getElementById("fileInput").click()}
            />

            <TableOfThings
              backendUrl={BACKEND_URL}
              docs={docsInTable} // Pass the table state with processing
              onSelect={(doc) => {
                setMetaPath(doc.metaPath);
                setSelectedDoc(doc);
              }}
            />

            {metaPath && (
              <MetadataEditor metaPath={metaPath} backendUrl={BACKEND_URL} key={metaPath} />
            )}
          </div>

          <div className="ocr-preview">
            <div className="ocr-title">Text</div>
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