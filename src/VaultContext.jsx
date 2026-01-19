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
      alert("File System Access API not supported in this browser.");
      return null;
    }

    try {
      const handle = await window.showDirectoryPicker();
      let perm = await handle.queryPermission({ mode: "readwrite" });

      if (perm !== "granted") {
        perm = await handle.requestPermission({ mode: "readwrite" });
      }

      if (perm !== "granted") {
        alert("Vault permission not granted. You can retry.");
        return null;
      }

      setVaultHandle(handle);
      return handle;
    } catch (err) {
      console.warn("Vault selection cancelled or failed:", err);
      return null;
    }
  }

  function ensureVault() {
    if (!vaultHandle) {
      alert("Vault not selected. Please choose a vault folder first.");
      return null;
    }
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
    if (!vault) return null;

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
    if (!vault) return null;

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

  async function loadAllItems() {
    const vault = ensureVault();
    if (!vault) return [];

    const entries = await walkDirectory(vault);
    const items = [];

    for (const e of entries) {
      if (e.kind === "file" && e.name === "item.json") {
        try {
          const data = await readJsonFile(e.handle);
          items.push(data);
        } catch (err) {
          console.warn("Failed to read item:", e.path);
        }
      }
    }

    return items;
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
    if (!vault) return [];

    try {
      const handle = await vault.getFileHandle("clients.json");
      const data = await readJsonFile(handle);
      return Array.isArray(data.clients) ? data.clients : [];
    } catch {
      return [];
    }
  }

  async function resolveClientForText(text) {
    const clients = await loadClients();
    const lowered = text.toLowerCase();

    for (const c of clients) {
      if (
        lowered.includes(c.last_name?.toLowerCase()) &&
        lowered.includes(c.first_name?.toLowerCase())
      ) {
        return c.id;
      }
    }
    return null;
  }

  async function loadVaultIndex() {
    const items = await loadAllItems();
    const clients = await loadClients();
    return { items, clients };
  }

  async function ensureDir(path) {
    const vault = ensureVault();
    if (!vault) return null;

    const parts = path.split("/").filter(Boolean);
    let current = vault;

    for (const part of parts) {
      let found = false;

      for await (const entry of current.values()) {
        if (entry.kind === "directory" && entry.name === part) {
          current = entry;
          found = true;
          break;
        }
      }

      if (!found) {
        current = await current.getDirectoryHandle(part, { create: true });
      }
    }
    return current;
  }

  const value = {
    vaultHandle,
    isReady: !!vaultHandle,
    chooseVault,
    loadVaultIndex,
    readFileAtPath,
    writeFileAtPath,
    ensureDir,
    resolveClientForText,
  };

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}
