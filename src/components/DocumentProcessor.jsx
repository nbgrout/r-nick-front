import React, { useState, useRef, useEffect } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import PdfViewer from "./PdfViewer";
import logoSrc from "../assets/Logo.png";
import { useVault } from "../VaultContext";

export default function DocumentProcessor() {
  const { chooseVault, isReady, listFiles, readFile, writeFile } = useVault();
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "";
  const dropRef = useRef(null);

  const [docsInTable, setDocsInTable] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [ocrTextByDoc, setOcrTextByDoc] = useState({});
  const [metaDataByDoc, setMetaDataByDoc] = useState({});
  const [loadingDocs, setLoadingDocs] = useState({}); // { docId: boolean }

  // -----------------------------
  // Load existing vault metadata on vault selection
  // -----------------------------
  const loadVaultDocuments = async () => {
    if (!isReady) return;
    try {
      const files = await listFiles();
      const docs = [];

      for (const file of files) {
        if (!file.name.toLowerCase().endsWith("_meta.json")) continue;
        const metaText = await readFile(file.name);
        const metadata = JSON.parse(metaText);

        const pdfName =
          metadata.filename || file.name.replace(/_meta\.json$/i, ".pdf");

        docs.push({
          id: file.name,
          name: pdfName,
          status: "ready",
          metaPath: file.name,
          metadata,
          file: null, // will populate when user selects
        });
      }

      setDocsInTable(docs);
    } catch (err) {
      console.error("Failed to load vault contents:", err);
    }
  };

  useEffect(() => {
    loadVaultDocuments();
  }, [isReady]);

  const handleChooseFolder = async () => {
    try {
      await chooseVault();
      loadVaultDocuments();
    } catch (err) {
      alert(err.message || "Vault selection failed");
    }
  };

  // -----------------------------
  // Handle PDF upload + OCR + metadata
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
      status: "digitizing",
      metaPath: null,
      metadata: {}, // empty initially
      file,
    };

    setDocsInTable((prev) => [...prev, newDoc]);
    setSelectedDoc(newDoc);
    setOcrTextByDoc((prev) => ({ ...prev, [docId]: "" }));
    setMetaDataByDoc((prev) => ({ ...prev, [docId]: { status: "processing" } }));
    setLoadingDocs((prev) => ({ ...prev, [docId]: true }));

    try {
      // 1️⃣ OCR
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("OCR upload failed");

      const uploadData = await uploadRes.json();
      setOcrTextByDoc((prev) => ({ ...prev, [docId]: uploadData.ocr_text }));

      // 2️⃣ Metadata extraction (async, can take time)
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
            ? { ...doc, status: "done", metaPath: metaFilename, metadata: metaData }
            : doc
        )
      );

      setMetaDataByDoc((prev) => ({ ...prev, [docId]: metaData }));
    } catch (err) {
      console.error(err);
      setDocsInTable((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, status: "error" } : doc))
      );
      alert(err.message || "Error processing file");
    } finally {
      setLoadingDocs((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => e.preventDefault();

  // -----------------------------
  // Handle selecting a document
  // -----------------------------
  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);

    // Load metadata immediately if available
    if (doc.metaPath) {
      try {
        const text = await readFile(doc.metaPath);
        const metadata = JSON.parse(text);
        setMetaDataByDoc((prev) => ({ ...prev, [doc.id]: metadata }));
      } catch {
        setMetaDataByDoc((prev) => ({ ...prev, [doc.id]: { status: "processing" } }));
      }
    }

    // Load OCR preview if File object is available
    if (!doc.file && doc.metaPath) {
      // optionally allow users to select PDF to attach File object
      // for now, can't load blob, PDF only displays for new uploads
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

            {selectedDoc && (
              <MetadataEditor
                metaPath={selectedDoc.metaPath}
                backendUrl={BACKEND_URL}
                metadataOverride={metaDataByDoc[selectedDoc.id]}
                loading={loadingDocs[selectedDoc.id]}
              />
            )}
          </div>

          <div className="ocr-preview">
            <div className="ocr-title">Document Preview</div>
            {selectedDoc && selectedDoc.file ? (
              <PdfViewer
                file={selectedDoc.file}
                ocrTextByPage={
                  ocrTextByDoc[selectedDoc.id]
                    ? ocrTextByDoc[selectedDoc.id].split(/\n\n--- Page \d+ ---\n/)
                        .filter((p) => p.trim() !== "")
                    : []
                }
              />
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
