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

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
  const dropRef = useRef(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/current-folder/`)
      .then(res => res.json())
      .then(data => setFolderPath(data.folder))
      .catch(console.error);
  }, []);

  const updateFolder = () => {
    fetch(`${BACKEND_URL}/set-folder/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder_path: folderPath })
    }).then(res => res.json()).then(console.log);
  };

  const handleFile = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
        method: "POST",
        body: formData
      });
      const uploadData = await uploadRes.json();

      const metaRes = await fetch(`${BACKEND_URL}/extract-meta/?filename=${uploadData.filename}`, {
        method: "POST"
      });
      const metaJson = await metaRes.json();

      setMetaPath(metaJson.meta_url);
      setOcrText(metaJson.ocr_text);
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
        <div className="folder-input">
          <label>Storage Folder:</label>
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            onBlur={updateFolder}
            style={{ width: "100%" }}
          />
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
            <TableOfThings backendUrl={BACKEND_URL} />
            <MetadataEditor metaPath={metaPath} backendUrl={BACKEND_URL} />
          </div>

          <div className="ocr-preview">
            <div className="ocr-title">Text</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{ocrText || "Drop PDF to start."}</pre>
          </div>
        </div>

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
