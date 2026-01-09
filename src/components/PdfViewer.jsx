// PdfViewer.jsx
import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Tell PDF.js where to find worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PdfViewer({ filePath, ocrTextByPage = [] }) {
  const [numPages, setNumPages] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Document file={filePath} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from({ length: numPages || 0 }, (_, index) => (
          <div
            key={index}
            style={{ position: "relative", width: "100%", marginBottom: 24 }}
          >
            {/* PDF page image */}
            <Page pageNumber={index + 1} width={600} />

            {/* Invisible/selectable OCR text */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none", // prevents blocking clicks/scroll
                userSelect: "text",
                whiteSpace: "pre-wrap",
                color: "transparent", // invisible text
              }}
            >
              {ocrTextByPage[index] || ""}
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
}
