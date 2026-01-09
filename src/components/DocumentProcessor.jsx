import React, { useState, useRef, useEffect } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import logoSrc from "../assets/Logo.png";
import { useVault } from "../VaultContext";
import PdfViewer from "./PdfViewer";

export default function DocumentProcessor() {
  const [ocrText, setOcrText] = useState("");
  const [metaPath, setMetaPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docsInTable, setDocsInTable] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);

  const { chooseVault, isReady, writeFile, listFiles, readFile } = useVault();
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "";
  const dropRef = useRef(null);

  // Split OCR text into pages, removing empty strings
  const ocrTextByPage = ocrText
    ? ocrText.split(/\n\n--- Page \d+ ---\n/).filter((p) => p.trim() !== "")
    : [];

  // -----------------------------
  // LOAD EXISTING METADATA FILES
  // -----------------------------
  useEffect(() => {
    if (!isReady) return;

    const loadVaultDocuments = async () => {
      try {
        const files = await listFiles();
        const docs = [];

        for (const file of files) {
          if (!file.name.toLowerCase().endsWith("_meta.json")) continue;

          const metaText = await readFile(file.name);
          const metadata = JSON.parse(metaText);

          docs.push({
            id: file.name,
            name:
              metadata.filename ||
              file.name.replace(/_meta\.json$/i, ".pdf"),
            status: "local",
            metaPath: file.name,
            metadata,
            file: null,
          });
        }

        setDocsInTable(docs);
      } catch (err) {
        console.error("Failed to load vault contents:", err);
      }
    };

    loadVaultDocuments();
  }, [isReady]);

  // -----------------------------
  // HANDLE VAULT SELECTION
  // -----------------------------
  const handleChooseFolder = async () => {
    try {
      await chooseVault();
    } catch (err) {
      alert(err.message || "Vault selection failed");
    }
  };

  // -----------------------------
  // HANDLE PDF UPLOAD + OCR + META
  // -----------------------------
  const handleFile = async (file) => {
    if (!isReady) {
      alert("Please select a vault first");
      return;
    }

    const docId = file.name + "-" + Date.now();

    const newDoc = {
      id: docId,
      name: file.name,
      status: "processing",
      metaPath: null,
      metadata: null,
      file,
    };

    setDocsInTable((prev) => [...prev, newDoc]);
    setSelectedDoc(newDoc);
    setLoading(true);

    try {
      // Convert File → Blob URL for PdfViewer
      const url = URL.createObjectURL(file);
      setFileUrl(url);

      // OCR
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("OCR upload failed");

      const uploadData = await uploadRes.json();
      setOcrText(uploadData.ocr_text);

      // Metadata extraction
      const metaForm = new FormData();
      metaForm.append("text", uploadData.ocr_text);

      const metaRes = await fetch(`${BACKEND_URL}/extract-meta/`, {
        method: "POST",
        body: metaForm,
      });

      if (!metaRes.ok) throw new Error("Metadata extraction failed");

      const metaData = (await metaRes.json()).metadata;
      const metaFilename = file.name.replace(/\.pdf$/i, "_meta.json");
      metaData.filename = file.name;

      await writeFile(metaFilename, JSON.stringify(metaData, null, 2));

      setDocsInTable((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? { ...doc, status: "local", metaPath: metaFilename, metadata: metaData }
            : doc
        )
      );
      setMetaPath(metaFilename);
    } catch (err) {
      console.error(err);
      setDocsInTable((prev) =>
        prev.map((doc) =>
          doc.id === docId ? { ...doc, status: "error" } : doc
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

  // -----------------------------
  // LOAD METADATA ON SELECTION
  // -----------------------------
  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);
    setMetaPath(null);

    if (!doc.metaPath) return;

    try {
      const metaText = await readFile(doc.metaPath);
      const metadata = JSON.parse(metaText);

      setDocsInTable((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, metadata, status: "local" } : d
        )
      );

      setMetaPath(doc.metaPath);

      // Also update OCR preview if available
      if (doc.file) {
        const url = URL.createObjectURL(doc.file);
        setFileUrl(url);
      }
    } catch {
      // Metadata not ready yet
    }
  };

  return (
    <>
      <header className="app-header">
        <img src={logoSrc} className="header-logo" alt="logo" />
        <h1 className="header-title">R. Nick</h1>
      </header>

      <div className="container">
        <div className="folder-input" style={{ marginBottom: 10 }}>
          <label>File / Folder:</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              value={isReady ? "File / Folder selected" : ""}
              readOnly
              style={{ flex: 1 }}
            />
            <button onClick={handleChooseFolder}>Choose File / Folder…</button>
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
              docs={docsInTable}
              onSelect={handleSelectDoc}
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
            <div className="ocr-title">Document Preview</div>
            {loading ? (
              <div>Processing…</div>
            ) : selectedDoc && fileUrl && ocrTextByPage.length > 0 ? (
              <PdfViewer file={fileUrl} ocrTextByPage={ocrTextByPage} />
            ) : (
              <div>Drop PDF to start.</div>
            )}
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
