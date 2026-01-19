// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import DocumentProcessor from "./components/DocumentProcessor";
import Contacts from "./components/Contacts";
import MemoEditor from "./components/MemoEditor.jsx";

function App() {
  return (
    <BrowserRouter>
      <header
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #ddd",
          display: "flex",
          gap: 12,
        }}
      >
        <Link to="/documents">Documents</Link>
        <Link to="/contacts">Contacts</Link>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/documents" element={<DocumentProcessor />} />
        <Route path="/contacts" element={<Contacts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
