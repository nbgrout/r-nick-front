// DocumentProcessor.jsx
import React, { useState, useRef } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";

import logoSrc from "../assets/logo.png";

export default function DocumentProcessor() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [metaPath, setMetaPath] = useState(null);
  const [status, setStatus] = useState("");
  const dropRef = useRef(null);

  const BACKEND_URL = "http://127.0.0.1:8000";

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    startProcess(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      startProcess(droppedFile);
    } else {
      alert("Please drop a PDF file.");
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const startProcess = async (file) => {
    setFile(file);
    setOcrText("");
    setMetaPath(null);
    setStatus("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const uploadData = await uploadRes.json();

      setOcrText(uploadData.ocr_text || "");
      setStatus("Extracting metadata…");

      const metaForm = new FormData();
      metaForm.append("text", uploadData.ocr_text);
      metaForm.append("filename", file.name);

      const metaRes = await fetch(`${BACKEND_URL}/extract-meta/`, {
        method: "POST",
        body: metaForm,
      });

      if (!metaRes.ok) throw new Error("Metadata extraction failed");
      const metaJson = await metaRes.json();

      setMetaPath(metaJson.meta_url);
      setStatus("Done");
    } catch (err) {
      console.error(err);
      alert("Error: " + err);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="app-header">
        <img src={logoSrc} className="header-logo" alt="logo" />
        <h1 className="header-title">R. Nick</h1>
        <span className="header-version">(v1)</span>
      </header>

      <div className="container">
        {/* file input (hidden) */}
        <input
          id="fileInput"
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* Status line */}
        <div style={{ marginBottom: 8, fontSize: 14 }}>
          {loading ? "Processing…" : status}
        </div>

        {/* Main grid: left = portal + brief, right = text */}
        <div className="processor-grid" ref={dropRef} onDrop={handleDrop} onDragOver={handleDragOver}>
          {/* LEFT STACK */}
          <div className="left-stack">
            {/* Portal + Man (top) */}
            <div className="hero-row">
              <PortalScene wrapperSize={300} manWidth={220} spinDuration={6} shiftManPercent={0.15} onChooseFile={() => document.getElementById("fileInput").click()}/>
            </div>

            {/* Brief (MetadataEditor) */}
            <div className="brief-card">
              <MetadataEditor metaPath={metaPath} backendUrl={BACKEND_URL} />
            </div>
          </div>

          {/* RIGHT: OCR / Text Preview */}
          <div>
            <div className="ocr-preview">
              <div className="ocr-title">Text</div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{ocrText || (file ? "No extracted text." : "Drop a PDF or use file picker to start.")}</pre>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
