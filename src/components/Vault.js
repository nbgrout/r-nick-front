const VAULT_KEY = 'rnick_vault_handle';

export async function chooseVault() {
  const handle = await window.showDirectoryPicker();
  await saveHandle(handle);
  return handle;
}

export async function getVaultHandle() {
  return await loadHandle();
}

export async function writeFile(handle, name, contents) {
  const fileHandle = await handle.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

export async function readFile(handle, name) {
  const fileHandle = await handle.getFileHandle(name);
  const file = await fileHandle.getFile();
  return await file.text();
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