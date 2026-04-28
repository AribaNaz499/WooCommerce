import { safeGetStorage, safeSetLocalStorage } from "./storage";

export const makeDraftFullKey = (draftId: string) => (draftId ? `draft:full:${draftId}` : "");

export const readDraftFull = (draftId: string) => {
  if (!draftId) return null;
  const key = makeDraftFullKey(draftId);
  const raw = safeGetStorage(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return null;
};

export const writeDraftFull = (draftId: string, data: any) => {
  if (!draftId) return false;
  const key = makeDraftFullKey(draftId);
  try {
    const payload = JSON.stringify({ draftId, ...data });
    return safeSetLocalStorage(key, payload, {
      clearOnFail: ["slides_backup"],
      fallbackToSession: true,
    });
  } catch {
    return false;
  }
};

export const clearDraftFull = (draftId: string) => {
  if (!draftId) return;
  const key = makeDraftFullKey(draftId);
  try {
    localStorage.removeItem(key);
  } catch {}
  try {
    sessionStorage.removeItem(key);
  } catch {}
};
