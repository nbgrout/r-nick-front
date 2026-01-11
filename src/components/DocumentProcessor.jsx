import React, { useState, useRef, useEffect } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import logoSrc from "../assets/Logo.png";
import { useVault } from "../VaultContext";
import PdfViewer from "./PdfViewer";

export default function DocumentProcessor() {
  const [docsInTable, setDocsInTable] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [ocrTextByPage, setOcrTextByPage] = useState([]);

  const dropRef = useRef(null);

  const {
    chooseVault,
    isReady,
    loadVaultIndex,
    writeFileAtPath,
    readFileAtPath,
  } = useVault();

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "";

  // -----------------------------
  // Load existing vault contents
  // -----------------------------
  async function loadVault() {
    const { documents } = await loadVaultIndex();
    setDocsInTable(documents);
  }

  useEffect(() => {
    if (isReady) loadVault();
  }, [isReady]);

  // -----------------------------
  // Folder selection
  // -----------------------------
  async function handleChooseFolder() {
    await chooseVault();
    await loadVault();
  }

  // -----------------------------
  // PDF ingestion pipeline
  // -----------------------------
  async function handleFile(file) {
    const docId = crypto.randomUUID();

    const placeholderMeta = {
      brief_description: "(processing)",
      document_type: "(processing)",
      tags: [],
      financial_items: [],
    };

    const newDoc = {
      id: docId,
      name: file.name,
      status: "processing",
      metadata: placeholderMeta,
      file,
      metaPath: null,
    };

    setDocsInTable((prev) => [...prev, newDoc]);
    setSelectedDoc(newDoc);
    setFileUrl(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    const ocrRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
      method: "POST",
      body: formData,
    });

    const { ocr_text } = await ocrRes.json();
    const pages = ocr_text.split(/\n\n--- Page \d+ ---\n/).filter(Boolean);
    setOcrTextByPage(pages);

    const metaForm = new FormData();
    metaForm.append("text", ocr_text);
    metaForm.append("original_filename", file.name);

    const metaRes = await fetch(`${BACKEND_URL}/extract-meta/`, {
      method: "POST",
      body: metaForm,
    });

    const { metadata } = await metaRes.json();

    const metaPath = `documents/${docId}/meta.json`;
const wrappedMeta = {
  schema_version: 1,
  original_filename: file.name,
  status: "ready",
  metadata
};

await writeFileAtPath(metaPath, JSON.stringify(wrappedMeta, null, 2));

    setDocsInTable((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
    ...d,
    name: file.name,
    status: "ready",
    metadata,
    metaPath
  }

          : d
      )
    );

    setSelectedDoc((prev) =>
      prev && prev.id === docId
        ? { ...prev, status: "ready", metadata, metaPath }
        : prev
    );
  }

  // -----------------------------
  // Drag / drop
  // -----------------------------
  function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleSelectDoc(doc) {
    setSelectedDoc(doc);
    if (doc.file) setFileUrl(URL.createObjectURL(doc.file));
  }

  return (
    <>
      <header className="app-header">
        <img src={logoSrc} className="header-logo" alt="logo" />
        <h1 className="header-title">R. Nick</h1>
      </header>

      <div className="container">
        <button onClick={handleChooseFolder}>Choose Vault</button>

        <div
          className="processor-grid"
          ref={dropRef}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="left-stack">
            <PortalScene
              onChooseFile={() =>
                document.getElementById("fileInput").click()
              }
            />

            <TableOfThings
              docs={docsInTable}
              onSelect={handleSelectDoc}
            />

            {selectedDoc && selectedDoc.metaPath && (
              <MetadataEditor
                metadata={selectedDoc.metadata}
                metaPath={selectedDoc.metaPath}
                key={selectedDoc.id}
              />
            )}
          </div>

          <div className="ocr-preview">
            {fileUrl ? (
              <PdfViewer
                file={fileUrl}
                ocrTextByPage={ocrTextByPage}
              />
            ) : (
              <div>Drop PDF to start.</div>
            )}
          </div>
        </div>

        <input
          id="fileInput"
          type="file"
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
