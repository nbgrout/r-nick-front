// DocumentProcessor.jsx
import React, { useState, useEffect, useRef } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import logoSrc from "../assets/Logo.png";
import { chooseVault, getVaultPath } from './vault';

export default function DocumentProcessor() {

  const [ocrText, setOcrText] = useState("");
  const [metaPath, setMetaPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
const [folderPath, setFolderPath] = useState(
  localStorage.getItem('vaultPath') || getVaultPath() || ""
);


  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
  const dropRef = useRef(null);

  // Load last used folder on mount
  useEffect(() => {
  fetch(`${BACKEND_URL}/current-folder/`)
    .then((res) => res.json())
    .then((data) => setFolderPath(data.base_dir)) // <- correct field
    .catch(console.error);
}, []);


  // Update backend folder
  const updateFolder = (folder) => {
    fetch(`${BACKEND_URL}/set-folder/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_path: folder }),
    })
      .then((res) => res.json())
      .then(console.log)
      .catch(console.error);
  };

  const handleChooseFolder = async () => {
  const folder = await chooseVault();
  if (folder) {
    setFolderPath(folder);
    // optionally tell FastAPI backend
    await fetch(`${BACKEND_URL}/case/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_path: folder }),
    });
  }
};
  useEffect(() => {
  if (folderPath) {
    localStorage.setItem('vaultPath', folderPath);
  }
}, [folderPath]);
  // Handle PDF upload and processing
  const handleFile = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_folder", folderPath);

      // Upload PDF
      const uploadRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      setOcrText(uploadData.ocr_text);

      // Extract metadata
      const metaForm = new FormData();
      metaForm.append("text", uploadData.ocr_text);
      metaForm.append("filename", file.name);
      metaForm.append("user_folder", folderPath);

      const metaRes = await fetch(`${BACKEND_URL}/extract-meta/`, {
  method: "POST",
  body: metaForm,
});
const metaJson = await metaRes.json();

const metaPathFromRes = metaJson?.meta_path || ""; // safe fallback

setMetaPath(metaPathFromRes);
setSelectedDoc({
  ...uploadData,
  metaPath: metaPathFromRes,
});

      setMetaPath(metaJson.meta_path);
      setSelectedDoc({
  ...uploadData,
  metaPath: metaJson.meta_path || "", // fallback
});
setMetaPath(metaJson.meta_path || "");
    } catch (err) {
      console.error(err);
      alert("Error processing file");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <>
      <header className="app-header">
        <img src={logoSrc} className="header-logo" alt="logo" />
        <h1 className="header-title">R. Nick</h1>
      </header>

      <div className="container">
       {/* Folder selection with Browse button */}
<div className="folder-input" style={{ marginBottom: 10 }}>
  <label>Vault Folder (for PDFs and metadata):</label>
  <div style={{ display: "flex", gap: 6 }}>
    <input
      type="text"
      value={folderPath}
      readOnly
      style={{ flex: 1 }}
      placeholder="No vault selected"
    />
    <button onClick={handleChooseFolder}>
      Choose Vault…
    </button>
  </div>
  <small style={{ color: "#666", display: "block", marginTop: 4 }}>
    Select a folder to act as your vault. All uploaded PDFs and metadata will be stored here.
  </small>
</div>

        {/* Processing grid */}
        <div
          className="processor-grid"
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="left-stack">
            {/* Portal */}
            <PortalScene
              wrapperSize={300}
              manWidth={220}
              spinDuration={6}
              shiftManPercent={0.15}
              onChooseFile={() => document.getElementById("fileInput").click()}
            />

            {/* Table of documents */}
            <TableOfThings
  backendUrl={BACKEND_URL}
  folderPath={folderPath}   // <-- pass folderPath
  onSelect={(doc) => {
    setMetaPath(doc.metaPath);
    setSelectedDoc(doc);
  }}
/>

            {/* Metadata/brief */}
            {metaPath && (
  <MetadataEditor
    metaPath={metaPath}
    backendUrl={BACKEND_URL}
    key={metaPath} 
  />
)}
          </div>

          {/* OCR preview */}
          <div className="ocr-preview">
            <div className="ocr-title">Text</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {loading ? "Processing…" : ocrText || "Drop PDF to start."}
            </pre>
          </div>
        </div>

        {/* Hidden file input for PDFs */}
        <input
          type="file"
          id="fileInput"
          accept="application/pdf"
          style={{ display: "none" }}
          onChange={(e) => e.target.files.length && handleFile(e.target.files[0])}
        />
      </div>
    </>
  );
}
