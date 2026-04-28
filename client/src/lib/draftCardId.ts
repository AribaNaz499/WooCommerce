export const DRAFT_CARD_ID_KEY = "draft:card_id";

export const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );

export const newUuid = () => globalThis.crypto.randomUUID();

export const setDraftCardId = (id: string) => {
  if (!isUuid(id)) throw new Error("draft card id must be uuid");
  localStorage.setItem(DRAFT_CARD_ID_KEY, id);
};

export const getDraftCardId = () => {
  const v = localStorage.getItem(DRAFT_CARD_ID_KEY);
  return v && isUuid(v) ? v : null;
};

export const clearDraftCardId = () => {
  localStorage.removeItem(DRAFT_CARD_ID_KEY);
};

export const ensureDraftCardId = (routeId?: string) => {
  const fromRoute = (routeId ?? "").trim();
  if (fromRoute && isUuid(fromRoute)) {
    setDraftCardId(fromRoute);
    return fromRoute;
  }
  const cached = getDraftCardId();
  if (cached) return cached;
  const created = newUuid();
  setDraftCardId(created);
  return created;
};
