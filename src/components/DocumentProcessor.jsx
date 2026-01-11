import React, { useState, useRef, useEffect } from "react";
import PortalScene from "./PortalScene";
import MetadataEditor from "./MetadataEditor";
import TableOfThings from "./TableOfThings";
import logoSrc from "../assets/Logo.png";
import { useVault } from "../VaultContext";
import PdfViewer from "./PdfViewer";

export default function DocumentProcessor() {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docsInTable, setDocsInTable] = useState([]);
  const [fileUrl, setFileUrl] = useState(null);
  const [clients, setClients] = useState([]);

  const { chooseVault, isReady, loadVaultIndex, readFileAtPath, writeFileAtPath } =
    useVault();

  const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "";
  const dropRef = useRef(null);

  // -----------------------------
  // Load vault contents
  // -----------------------------
  const loadVault = async () => {
    const { clients, documents } = await loadVaultIndex();
    setClients(clients);
    setDocsInTable(documents);
  };

  useEffect(() => {
    if (isReady) loadVault();
  }, [isReady]);

  // -----------------------------
  // Vault selection
  // -----------------------------
  const handleChooseFolder = async () => {
    await chooseVault();
    await loadVault();
  };

  // -----------------------------
  // Select doc
  // -----------------------------
  const handleSelectDoc = async (doc) => {
    setSelectedDoc(doc);
    if (!doc.metaPath) return;

    try {
      const text = await readFileAtPath(doc.metaPath);
      const metadata = JSON.parse(text);

      setDocsInTable((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, metadata, status: "ready" } : d
        )
      );
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <header className="app-header">
        <img src={logoSrc} className="header-logo" alt="logo" />
        <h1 className="header-title">R. Nick</h1>
      </header>

      <div className="container">
        <button onClick={handleChooseFolder}>
          Choose File / Folder…
        </button>

        <div className="processor-grid" ref={dropRef}>
          <div className="left-stack">
            <PortalScene />
            <TableOfThings docs={docsInTable} onSelect={handleSelectDoc} />
            {selectedDoc && (
              <MetadataEditor
                metadata={selectedDoc.metadata}
                metaPath={selectedDoc.metaPath}
                key={selectedDoc.id}
              />
            )}
          </div>

          <div className="ocr-preview">
            {fileUrl ? <PdfViewer file={fileUrl} /> : "Drop PDF to start."}
          </div>
        </div>
      </div>
    </>
  );
}
