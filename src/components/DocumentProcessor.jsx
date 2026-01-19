// DocumentProcessor.jsx
import React, { useState, useRef, useEffect } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import MemoEditor from "./MemoEditor";
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
    resolveClientForText,
  } = useVault();

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "";

  // -----------------------------
  // Load vault items safely
  // -----------------------------
async function loadVault() {
  const vaultData = await loadVaultIndex();
  if (!vaultData) return;

  const { items } = vaultData;

  // Map items to include required fields for TableOfThings
  const mappedItems = items.map((item) => ({
    id: item.id,
    name: item.metadata?.title || item.id,
    status: item.status || "ready",
    metadata: item.metadata || {},
    metaPath: item.item_type === "memo" ? null : `documents/${item.id}/meta.json`,
    item_type: item.item_type,
  }));

  setDocsInTable(mappedItems);
}


  useEffect(() => {
    if (isReady) loadVault();
  }, [isReady]);

  // -----------------------------
  // Vault selection
  // -----------------------------
  async function handleChooseFolder() {
    await chooseVault();
    await loadVault();
  }

  // -----------------------------
  // Create new memo
  // -----------------------------
  async function createNewMemo() {
    if (!isReady) return;

    const memoId = crypto.randomUUID();
    const memo = {
      item_version: 1,
      id: memoId,
      item_type: "memo",
      client_id: null,
      status: "ready",
      created_at: new Date().toISOString(),
      metadata: {
        title: "New Memo",
        body: "",
        tags: [],
      },
    };

    const path = `memos/${memoId}/item.json`;
    await writeFileAtPath(path, JSON.stringify(memo, null, 2));

    // Reload vault items
    const { items } = await loadVaultIndex();
    setDocsInTable(items);

    // Auto-select the memo
    const created = items.find((i) => i.id === memoId);
    if (created) setSelectedDoc(created);
  }

  // -----------------------------
  // Handle PDF ingestion
  // -----------------------------
  async function handleFile(file) {
    if (!isReady) {
      alert("Please choose a vault first.");
      return;
    }

    const docId = crypto.randomUUID();

    const placeholderMeta = {
      brief_description: "(processing)",
      document_type: "(processing)",
      tags: [],
      total_bill: 0,
    };

    const newDoc = {
      id: docId,
      name: file.name,
      status: "processing",
      item_type: "document",
      metadata: placeholderMeta,
      file,
      metaPath: null,
    };

    setDocsInTable((prev) => [...prev, newDoc]);
    setSelectedDoc(newDoc);
    setFileUrl(URL.createObjectURL(file));

    // 1. Save original PDF
    const pdfArrayBuffer = await file.arrayBuffer();
    const pdfPath = `documents/${docId}/source.pdf`;
    await writeFileAtPath(pdfPath, new Uint8Array(pdfArrayBuffer));

    // 2. OCR via backend
    const formData = new FormData();
    formData.append("file", file);

    const ocrRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
      method: "POST",
      body: formData,
    });
    const { ocr_text } = await ocrRes.json();

    const textPath = `documents/${docId}/text.txt`;
    await writeFileAtPath(textPath, ocr_text);

    // 3. Extract client and metadata
    const clientId = await resolveClientForText(ocr_text);

    const metaForm = new FormData();
    metaForm.append("text", ocr_text);
    metaForm.append("original_filename", file.name);

    const metaRes = await fetch(`${BACKEND_URL}/extract-meta/`, {
      method: "POST",
      body: metaForm,
    });
    const { metadata } = await metaRes.json();

    // 4. Save metadata
    const metaPath = `documents/${docId}/meta.json`;
    const wrappedMeta = {
      item_version: 1,
      id: docId,
      item_type: "document",
      client_id: clientId,
      status: "ready",
      created_at: new Date().toISOString(),
      source: { original_filename: file.name, path: pdfPath },
      metadata,
    };
    await writeFileAtPath(metaPath, JSON.stringify(wrappedMeta, null, 2));

    // 5. Update UI
    setDocsInTable((prev) =>
      prev.map((d) =>
        d.id === docId
          ? { ...d, name: file.name, status: "ready", metadata, metaPath }
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
  // Drag & drop
  // -----------------------------
  function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  function handleSelectDoc(item) {
    setSelectedDoc(item);
    if (item.file && item.item_type === "document") {
      setFileUrl(URL.createObjectURL(item.file));
    }
  }

  return (
    <>
      <header className="app-header">
        <img src={logoSrc} className="header-logo" alt="logo" />
        <h1 className="header-title">R. Nick</h1>
      </header>

      <div className="container">
        <button onClick={handleChooseFolder}>Choose Vault</button>
        <button onClick={createNewMemo} disabled={!isReady}>
          New Memo
        </button>

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

            <TableOfThings items={docsInTable} onSelect={handleSelectDoc} />

            {selectedDoc && selectedDoc.id && (
              <>
                {selectedDoc.item_type === "memo" ? (
                  <MemoEditor
                    key={selectedDoc.id}
                    onSaved={async () => {
                      const { items } = await loadVaultIndex();
                      setDocsInTable(items);
                      setSelectedDoc(null);
                    }}
                  />
                ) : (
                  <MetadataEditor metaPath={selectedDoc.metaPath} key={selectedDoc.id} />
                )}
              </>
            )}
          </div>

          <div className="ocr-preview">
            {fileUrl ? (
              <PdfViewer file={fileUrl} ocrTextByPage={ocrTextByPage} />
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
