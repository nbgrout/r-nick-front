import React, { useState, useRef, useEffect } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import logoSrc from "../assets/Logo.png";
import { useVault } from "../VaultContext";
import PdfViewer from "./PdfViewer";

export default function DocumentProcessor() {
  const [ocrText, setOcrText] = useState("");
  const [ocrTextByPage, setOcrTextByPage] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docsInTable, setDocsInTable] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);

  const { chooseVault, isReady, writeFile, listFiles, readFile } = useVault();
  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "";
  const dropRef = useRef(null);

  // -----------------------------
  // LOAD EXISTING METADATA FILES
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

        docs.push({
          id: file.name,
          name: metadata.filename || file.name.replace(/_meta\.json$/i, ".pdf"),
          status: "ready",
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

  useEffect(() => {
    loadVaultDocuments();
  }, [isReady]);

  // -----------------------------
  // HANDLE VAULT SELECTION
  // -----------------------------
  const handleChooseFolder = async () => {
    try {
      await chooseVault();
      loadVaultDocuments();
    } catch (err) {
      alert(err.message || "Vault selection failed");
    }
  };

  // -----------------------------
  // HANDLE PDF UPLOAD
  // -----------------------------
  const handleFile = async (file) => {
    if (!isReady) {
      alert("Please select a vault first");
      return;
    }

    const docId = file.name + "-" + Date.now();

    const placeholderMetadata = {
      summary: "(processing)",
      author: "(processing)",
      individuals: "(processing)",
      date_authored: "(processing)",
      earliest_date: "(processing)",
      latest_date: "(processing)",
      num_visits: "(processing)",
      diagnoses: "(processing)",
      doc_type: "(processing)",
      audience: "(processing)",
      total_medical_cost: "(processing)",
    };

    // Optimistic UI entry
    const newDoc = {
      id: docId,
      name: file.name,
      status: "digitizing", // OCR running
      metaPath: null,
      metadata: placeholderMetadata,
      file,
    };

    setDocsInTable((prev) => [...prev, newDoc]);
    setSelectedDoc(newDoc);

    // Show PDF immediately
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setOcrText("");
    setOcrTextByPage([]);

    try {
      // -----------------------------
      // OCR
      // -----------------------------
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${BACKEND_URL}/upload-pdf/`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("OCR upload failed");

      const { ocr_text } = await uploadRes.json();
      setOcrText(ocr_text);

      const pages = ocr_text
        .split(/\n\n--- Page \d+ ---\n/)
        .filter((p) => p.trim() !== "");
      setOcrTextByPage(pages);

      // -----------------------------
      // Metadata extraction
      // -----------------------------
      setDocsInTable((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, status: "briefing" } : doc))
      );

      const metaForm = new FormData();
      metaForm.append("text", ocr_text);

      const metaRes = await fetch(`${BACKEND_URL}/extract-meta/`, {
        method: "POST",
        body: metaForm,
      });

      if (!metaRes.ok) throw new Error("Metadata extraction failed");

      const { metadata } = await metaRes.json();
      const metaFilename = file.name.replace(/\.pdf$/i, "_meta.json");
      metadata.filename = file.name;

      await writeFile(metaFilename, JSON.stringify(metadata, null, 2));

      setDocsInTable((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? { ...doc, status: "done", metaPath: metaFilename, metadata }
            : doc
        )
      );

      setSelectedDoc((prev) =>
        prev && prev.id === docId ? { ...prev, status: "done", metadata, metaPath: metaFilename } : prev
      );
    } catch (err) {
      console.error(err);
      setDocsInTable((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, status: "error" } : doc))
      );
      alert(err.message || "Error processing file");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);

    if (!doc.metaPath) return;

    try {
      const text = await readFile(doc.metaPath);
      const metadata = JSON.parse(text);

      setDocsInTable((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, metadata, status: "ready" } : d
        )
      );

      // Show PDF preview if file exists
      if (doc.file) setFileUrl(URL.createObjectURL(doc.file));
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

            {selectedDoc && (
              <MetadataEditor
                metadata={selectedDoc.metadata}
                metaPath={selectedDoc.metaPath}
                status={selectedDoc.status}
                backendUrl={BACKEND_URL}
                fileName={selectedDoc.name}
                key={selectedDoc.id}
              />
            )}
          </div>

          <div className="ocr-preview">
            <div className="ocr-title">Document Preview</div>
            {selectedDoc && fileUrl ? (
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
          onChange={(e) => e.target.files.length && handleFile(e.target.files[0])}
        />
      </div>
    </>
  );
}
