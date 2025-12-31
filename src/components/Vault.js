// src/components/vault.js

// Prompt user to choose a vault folder (browser-friendly)
export async function chooseVault() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true; // allows folder selection
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        const folder = e.target.files[0].webkitRelativePath.split("/")[0];
        localStorage.setItem("vaultPath", folder); // persist selection
        resolve(folder);
      } else {
        resolve("");
      }
    };
    input.click();
  });
}

// Get the last-selected vault from localStorage
export function getVaultPath() {
  return localStorage.getItem("vaultPath") || "";
}

// Save vault to localStorage manually (optional)
export function setVaultPath(folder) {
  localStorage.setItem("vaultPath", folder);
}
