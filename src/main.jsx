// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { VaultProvider } from "./VaultContext.jsx"; // ✅ include .jsx extension

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <VaultProvider>
      <App />
    </VaultProvider>
  </StrictMode>
);
