/**
 * VaultContext.jsx
 * Single authoritative owner of the FileSystemDirectoryHandle
 * Handles recursive scanning + JSON loading
 */

import React, { createContext, useContext, useState } from "react";

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [vaultHandle, setVaultHandle] = useState(null);

  // -----------------------------
  // Vault Selection
  // -----------------------------
  async function chooseVault() {
    if (!window.showDirectoryPicker) {
      throw new Error("File System Access API not supported");
    }

const handle = await window.showDirectoryPicker();
const perm = await handle.queryPermission({ mode: "readwrite" });

if (perm !== "granted") {
  const req = await handle.requestPermission({ mode: "readwrite" });
  if (req !== "granted") {
    throw new Error("Vault permission not granted");
  }
}


    if (perm !== "granted") {
      throw new Error("Vault permission not granted");
    }

    setVaultHandle(handle);
    return handle;
  }

  function ensureVault() {
    if (!vaultHandle) throw new Error("Vault not selected");
    return vaultHandle;
  }

  // -----------------------------
  // Low-level FS helpers
  // -----------------------------
  async function readTextFile(fileHandle) {
    const file = await fileHandle.getFile();
    return await file.text();
  }

  async function readJsonFile(fileHandle) {
    const text = await readTextFile(fileHandle);
    return JSON.parse(text);
  }

  async function readFileAtPath(path) {
    const vault = ensureVault();
    const parts = path.split("/").filter(Boolean);

    let dir = vault;
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i]);
    }

    const fileHandle = await dir.getFileHandle(parts.at(-1));
    return await readTextFile(fileHandle);
  }

  async function writeFileAtPath(path, contents) {
    const vault = ensureVault();
    const parts = path.split("/").filter(Boolean);

    let dir = vault;
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create: true });
    }

    const fileHandle = await dir.getFileHandle(parts.at(-1), { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
  }

  // -----------------------------
  // Recursive directory walk
  // -----------------------------
  async function walkDirectory(dirHandle, basePath = "") {
    const results = [];

    for await (const [name, entry] of dirHandle.entries()) {
      const path = `${basePath}/${name}`;

      if (entry.kind === "file") {
        results.push({ kind: "file", name, path, handle: entry });
      } else if (entry.kind === "directory") {
        const nested = await walkDirectory(entry, path);
        results.push(...nested);
      }
    }

    return results;
  }

  // -----------------------------
  // High-level loaders
  // -----------------------------
  async function loadClients() {
    const vault = ensureVault();
    try {
      const handle = await vault.getFileHandle("clients.json");
      const data = await readJsonFile(handle);
      return Array.isArray(data.clients) ? data.clients : [];
    } catch {
      return [];
    }
  }

  async function loadAllMetadata() {
    const vault = ensureVault();
    const entries = await walkDirectory(vault);

    const docs = [];

    for (const e of entries) {
      if (e.kind === "file" && e.name === "meta.json") {
        try {
          const meta = await readJsonFile(e.handle);
          docs.push({
            id: meta.bates_name || e.path,
            metaPath: e.path.replace(/^\//, ""),
            metadata: meta || {},
            status: "ready",
          });
        } catch (err) {
          console.warn("Failed to read meta:", e.path, err);
        }
      }
    }

    return docs;
  }

  async function loadVaultIndex() {
    const [clients, documents] = await Promise.all([
      loadClients(),
      loadAllMetadata(),
    ]);

    return { clients, documents };
  }

  const value = {
    vaultHandle,
    isReady: !!vaultHandle,
    chooseVault,
    loadVaultIndex,
    readFileAtPath,
    writeFileAtPath,
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}
