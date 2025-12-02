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

        {/* CLEAN MINIMAL HERO — ONLY PORTAL + MAN */}
        <div
          className="hero-row"
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ display: "flex", alignItems: "center", padding: "20px 0" }}
        >
          <PortalScene leftOffset={0} wrapperSize={300} manWidth={220} />

          {/* Invisible click target for file picker */}
          <input
            id="fileInput"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        <div style={{ marginTop: 10, fontSize: 14 }}>
          {loading ? "Processing…" : status}
        </div>

        <MetadataEditor metaPath={metaPath} backendUrl={BACKEND_URL} />

        <div className="ocr-preview" style={{ marginTop: 16 }}>
          <div className="ocr-title">OCR Text Preview</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{ocrText}</pre>
        </div>
      </div>
    </>
  );
}
