
import React, { createContext, useContext, useState } from "react";

/**
 * VaultContext.jsx
 * Single authoritative owner of the FileSystemDirectoryHandle
 */

const VaultContext = createContext(null);

export function VaultProvider({ children }) {
  const [vaultHandle, setVaultHandle] = useState(null);

  async function chooseVault() {
    if (!window.showDirectoryPicker) {
      throw new Error("File System Access API not supported");
    }

    const handle = await window.showDirectoryPicker({
      mode: "readwrite",
    });

    if (!handle) {
      throw new Error("Vault selection cancelled");
    }

    const perm = await handle.requestPermission({ mode: "readwrite" });
    if (perm !== "granted") {
      throw new Error("Vault permission not granted");
    }

    setVaultHandle(handle);
  }

  function ensureVault() {
    if (!vaultHandle) {
      throw new Error("Vault not selected");
    }
    return vaultHandle;
  }

  async function writeFile(name, contents) {
    const vault = ensureVault();
    const fileHandle = await vault.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
  }

  async function readFile(name) {
    const vault = ensureVault();
    const fileHandle = await vault.getFileHandle(name);
    const file = await fileHandle.getFile();
    return await file.text();
  }

  async function listMetadataFiles() {
    const vault = ensureVault();
    const files = [];

    for await (const [name, entry] of vault.entries()) {
      if (entry.kind === "file" && name.endsWith("_meta.json")) {
        files.push(name);
      }
    }

    return files;
  }

  const value = {
    vaultHandle,
    isReady: !!vaultHandle,

    chooseVault,
    ensureVault,

    writeFile,
    readFile,
    listMetadataFiles,
  };

  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) {
    throw new Error("useVault must be used inside <VaultProvider>");
  }
  return ctx;
}
