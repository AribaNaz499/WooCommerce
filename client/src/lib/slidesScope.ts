import { getDraftCardId } from "./draftCardId";
import {
  clearSlidesFromIdbByKey,
  loadSlidesFromIdbByKey,
  saveSlidesToIdbByKey,
} from "./idbSlides";

export type SlidesPayload = Record<string, string>;

type ScopeOptions = {
  draftId?: string | null;
  previewKey?: string | null;
  productKey?: string | null;
  category?: string | null;
  cardSize?: string | null;
  includeStoredDraft?: boolean;
};

const IDB_SCOPE_PREFIX = "scope:";
const SESSION_SCOPE_PREFIX = "slides:scope:";
const BACKUP_SCOPE_PREFIX = "slides_backup:scope:";

const lc = (value: unknown) => String(value ?? "").trim().toLowerCase();

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const normalizeSlidesPayload = (value: unknown): SlidesPayload | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entries = Object.entries(value).filter(
    ([, dataUrl]) => typeof dataUrl === "string" && dataUrl.startsWith("data:image/"),
  );
  return entries.length ? (Object.fromEntries(entries) as SlidesPayload) : null;
};

const buildScopeStorageKeys = (scope: string) => ({
  idbKey: `${IDB_SCOPE_PREFIX}${scope}`,
  sessionKey: `${SESSION_SCOPE_PREFIX}${scope}`,
  backupKey: `${BACKUP_SCOPE_PREFIX}${scope}`,
});

export const buildSlidesScopeCandidates = (options: ScopeOptions = {}) => {
  const scopes: string[] = [];
  const add = (scope: string) => {
    const normalized = scope.trim();
    if (!normalized) return;
    scopes.push(normalized);
  };

  if (options.previewKey) {
    add(`preview:${options.previewKey}`);
  }

  if (options.draftId) {
    add(`draft:${options.draftId}`);
  }

  const productKey = lc(options.productKey);
  const category = lc(options.category);
  const cardSize = lc(options.cardSize);
  if (productKey || category || cardSize) {
    add(`product:${productKey}:${category}:${cardSize}`);
  }

  return unique(scopes);
};

export const resolveSlidesScopeCandidates = (options: ScopeOptions = {}) => {
  const draftId =
    options.draftId === undefined
      ? options.includeStoredDraft === false
        ? null
        : getDraftCardId()
      : options.draftId;
  let previewKey = options.previewKey ?? null;

  if (!previewKey) {
    try {
      previewKey = sessionStorage.getItem("templ_preview_key");
    } catch {
      previewKey = null;
    }
  }

  return buildSlidesScopeCandidates({
    ...options,
    draftId,
    previewKey,
  });
};

export const loadSlidesFromScopes = async (scopes: string[]): Promise<SlidesPayload | null> => {
  for (const scope of unique(scopes)) {
    const keys = buildScopeStorageKeys(scope);

    try {
      const fromIdb = normalizeSlidesPayload(await loadSlidesFromIdbByKey(keys.idbKey));
      if (fromIdb) return fromIdb;
    } catch {}

    try {
      const fromSession = normalizeSlidesPayload(JSON.parse(sessionStorage.getItem(keys.sessionKey) || "null"));
      if (fromSession) return fromSession;
    } catch {}

    try {
      const fromLocal = normalizeSlidesPayload(JSON.parse(localStorage.getItem(keys.backupKey) || "null"));
      if (fromLocal) return fromLocal;
    } catch {}
  }

  return null;
};

export const saveSlidesToScopes = async (scopes: string[], slides: SlidesPayload) => {
  const payload = normalizeSlidesPayload(slides);
  if (!payload) return null;

  await Promise.all(
    unique(scopes).map(async (scope) => {
      const keys = buildScopeStorageKeys(scope);

      try {
        await saveSlidesToIdbByKey(keys.idbKey, payload);
      } catch {}

      try {
        sessionStorage.setItem(keys.sessionKey, JSON.stringify(payload));
      } catch {}

      try {
        localStorage.setItem(keys.backupKey, JSON.stringify(payload));
      } catch {}
    }),
  );

  return payload;
};

export const clearSlidesFromScopes = async (scopes: string[]) => {
  await Promise.all(
    unique(scopes).map(async (scope) => {
      const keys = buildScopeStorageKeys(scope);

      try {
        sessionStorage.removeItem(keys.sessionKey);
      } catch {}

      try {
        localStorage.removeItem(keys.backupKey);
      } catch {}

      try {
        await clearSlidesFromIdbByKey(keys.idbKey);
      } catch {}
    }),
  );
};
