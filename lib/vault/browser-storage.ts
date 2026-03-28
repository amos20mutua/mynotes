"use client";

import { defaultVaultData } from "@/lib/vault/default-vault";
import { materializeVaultData } from "@/lib/vault/persistence";
import type { VaultData } from "@/types";

const DATABASE_NAME = "obsidian-vault";
const DATABASE_VERSION = 1;
const STORE_NAME = "vault";
const PRIMARY_KEY = "primary";
const LOCAL_STORAGE_KEY = "obsidian-vault";
const DEVICE_ID_KEY = "vault-device-id";

function openVaultDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open vault database"));
  });
}

function readVaultFromIndexedDb(): Promise<VaultData | null> {
  return openVaultDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(PRIMARY_KEY);

        request.onsuccess = () => resolve((request.result as VaultData | undefined) ?? null);
        request.onerror = () => reject(request.error ?? new Error("Could not read vault database"));
      })
  );
}

function writeVaultToIndexedDb(data: VaultData): Promise<void> {
  return openVaultDatabase().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(data, PRIMARY_KEY);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error ?? new Error("Could not write vault database"));
      })
  );
}

function readVaultFromLocalStorage(): VaultData | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as VaultData;
  } catch {
    return null;
  }
}

function writeVaultToLocalStorage(data: VaultData) {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota and privacy-mode failures. IndexedDB may still succeed.
  }
}

export function getOrCreateVaultDeviceId() {
  if (typeof window === "undefined") {
    return "server-device";
  }

  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const nextValue = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `device-${Date.now()}`;
  window.localStorage.setItem(DEVICE_ID_KEY, nextValue);
  return nextValue;
}

export async function readBrowserVault(): Promise<VaultData> {
  if (typeof window === "undefined") {
    return defaultVaultData;
  }

  const localVault = materializeVaultData(readVaultFromLocalStorage());

  if ("indexedDB" in window) {
    try {
      const indexedDbVault = await readVaultFromIndexedDb();

      if (indexedDbVault) {
        const mergedVault = materializeVaultData(indexedDbVault);
        writeVaultToLocalStorage(mergedVault);
        return mergedVault;
      }
    } catch {
      return localVault;
    }
  }

  return localVault;
}

export async function writeBrowserVault(data: VaultData): Promise<VaultData> {
  const mergedVault = materializeVaultData(data);

  if (typeof window === "undefined") {
    return mergedVault;
  }

  writeVaultToLocalStorage(mergedVault);

  if ("indexedDB" in window) {
    try {
      await writeVaultToIndexedDb(mergedVault);
    } catch {
      return mergedVault;
    }
  }

  return mergedVault;
}
