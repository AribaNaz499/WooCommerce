// src/lib/idbSlideState.ts
// Store heavy slide editor state in IndexedDB to avoid localStorage quota issues.

const DB_NAME = "diyp-editor-state-db";
const STORE_NAME = "slide_state";
const DB_VERSION = 1;

const openDb = (): Promise<IDBDatabase | null> =>
  new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });

export const getSlideStateKeys = (slide: number, draftId?: string | null) => {
  const base = `slide${slide}_state`;
  return draftId ? [`${base}:${draftId}`, base] : [base];
};

export const getSlideStateSnapshotKeys = (slide: number, draftId?: string | null) =>
  getSlideStateKeys(slide, draftId).map((key) => `${key}:snapshot`);

export const saveSlideStateToIdb = async (key: string, state: unknown) => {
  const db = await openDb();
  if (!db) return;
  return await new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(state, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const loadSlideStateFromIdb = async <T = unknown>(key: string): Promise<T | null> => {
  const db = await openDb();
  if (!db) return null;
  return await new Promise<T | null>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result ?? null) as T | null);
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
};

export const clearSlideStateFromIdb = async (key: string) => {
  const db = await openDb();
  if (!db) return;
  return await new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    } catch (e) {
      reject(e);
    }
  });
};
