// src/lib/storage.ts
// Small helpers to avoid QuotaExceeded errors from breaking flows.

export const safeSetLocalStorage = (
  key: string,
  value: string,
  opts?: { clearOnFail?: string[]; fallbackToSession?: boolean }
) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // try freeing space then retry once
    try {
      (opts?.clearOnFail ?? []).forEach((k) => localStorage.removeItem(k));
    } catch {}
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      if (opts?.fallbackToSession) {
        return safeSetSessionStorage(key, value);
      }
      return false;
    }
  }
};

export const safeSetSessionStorage = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const safeGetStorage = (key: string) => {
  try {
    const v = localStorage.getItem(key);
    if (v != null) return v;
  } catch {}

  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
