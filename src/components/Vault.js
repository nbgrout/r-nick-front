// vault.js — browser-safe "Obsidian-style" vault picker

const VAULT_KEY = 'rnick_vault_handle';

export async function chooseVault() {
  if (!window.showDirectoryPicker) {
    alert('Your browser does not support folder access.');
    return null;
  }

  const handle = await window.showDirectoryPicker();
  await saveHandle(handle);
  return handle.name;
}

export async function getVaultPath() {
  const handle = await loadHandle();
  return handle ? handle.name : '';
}

/* ---------- persistence ---------- */

async function saveHandle(handle) {
  const db = await openDB();
  await db.put('vault', handle, VAULT_KEY);
}

async function loadHandle() {
  const db = await openDB();
  return await db.get('vault', VAULT_KEY);
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rnick', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('vault');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}