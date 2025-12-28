// DocumentProcessor.jsx
import React, { useState, useEffect, useRef } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import logoSrc from "../assets/Logo.png";

export default function DocumentProcessor() {
  const [folderPath, setFolderPath] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [metaPath, setMetaPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
  const dropRef = useRef(null);

  // Load last used folder on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/current-folder/`)
      .then(res => res.json())
      .then(data => setFolderPath(data.folder))
      .catch(console.error);
  }, []);

  // Update backend folder
  const updateFolder = () => {
    fetch(`${BACKEND_URL}/set-folder/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_path: folderPath })
    }).then(res => res.json()).then(console.log);
  };

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
        body: formData
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
        body: metaForm
      });
      const metaJson = await metaRes.json();

      setMetaPath(metaJson.meta_path);
      setSelectedDoc({
        ...uploadData,
        metaPath: metaJson.meta_path
      });
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
        {/* Folder selection */}
        <div className="folder-input" style={{ marginBottom: 10 }}>
          <label>Storage Folder:</label>
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            onBlur={updateFolder}
            style={{ width: "100%" }}
          />
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
              onSelect={(doc) => {
                setMetaPath(doc.metaPath);
                setSelectedDoc(doc);
              }}
            />

            {/* Metadata/brief */}
            <MetadataEditor
              metaPath={metaPath}
              backendUrl={BACKEND_URL}
              key={metaPath} // ensures refresh
            />
          </div>

          {/* OCR preview */}
          <div className="ocr-preview">
            <div className="ocr-title">Text</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {loading ? "Processing…" : ocrText || "Drop PDF to start."}
            </pre>
          </div>
        </div>

        {/* Hidden file input */}
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
