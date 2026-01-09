// DocumentProcessor.jsx
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

  const { chooseVault, isReady, writeFile, listFiles, readFile } = useVault();

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "";
  const dropRef = useRef(null);

  // Split OCR text into pages (simple heuristic)
  const ocrTextByPage = ocrText
    ? ocrText.split(/\f|\n\n---PAGE BREAK---\n\n/)
    : [];

  // Load existing vault metadata on vault selection
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
            file: null, // existing vault docs don’t have File objects
          });
        }

        setDocsInTable(docs);
      } catch (err) {
        console.error("Failed to load vault contents:", err);
      }
    };

    loadVaultDocuments();
  }, [isReady]);

  const handleChooseFolder = async () => {
    try {
      await chooseVault();
    } catch (err) {
      console.error("Vault selection failed:", err);
      alert(err.message || "Vault selection failed");
    }
  };

  const handleFile = async (file) => {
    if (!isReady) {
      alert("Please select a vault first");
      return;
    }

    const newDoc = {
      id: file.name + "-" + Date.now(),
      name: file.name,
      status: "processing",
      metaPath: null,
      file, // ✅ store File object for PdfViewer
    };

    setDocsInTable((prev) => [...prev, newDoc]);
    setSelectedDoc(newDoc);
    setLoading(true);

    try {
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

      const metadata = (await metaRes.json()).metadata;

      // Save metadata locally
      const metaFilename = file.name.replace(/\.pdf$/i, "_meta.json");
      metadata.filename = file.name;

      await writeFile(metaFilename, JSON.stringify(metadata, null, 2));

      // Update table row
      setDocsInTable((prev) =>
        prev.map((doc) =>
          doc.id === newDoc.id
            ? {
                ...doc,
                status: "local",
                metaPath: metaFilename,
                metadata,
              }
            : doc
        )
      );

      setMetaPath(metaFilename);
    } catch (err) {
      console.error(err);
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
          <label>File / Folder (for documents and metadata):</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              value={isReady ? "File / Folder selected" : ""}
              readOnly
              style={{ flex: 1 }}
              placeholder="No file or folder selected"
            />
            <button onClick={handleChooseFolder}>
              Choose File / Folder…
            </button>
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
              docs={docsInTable}
              onSelect={(doc) => {
                setMetaPath(doc.metaPath);
                setSelectedDoc(doc);
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
            <div className="ocr-title">Document Preview</div>
            {loading ? (
              <div>Processing…</div>
            ) : selectedDoc && selectedDoc.file && ocrText ? (
              <PdfViewer
                file={selectedDoc.file}
                ocrTextByPage={ocrTextByPage}
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
