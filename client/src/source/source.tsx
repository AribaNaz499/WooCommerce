import { supabase, supabaseAdmin, supabasePublic } from "../supabase/supabase";
import { toast } from 'react-hot-toast';
import { finishTiming, logTiming, startTiming } from "../lib/debugTimings";

// ============ BROWSER DETECTION ============
const isSafari = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|FxiOS|Firefox|EdgiOS|EdgA|OPiOS|OPR|Android/i.test(ua);
};

// On Vercel (production), always use public client first for Safari
// to avoid auth cookie issues across domains
const preferPublicCatalogOnly = () => isSafari();

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timeoutId: number | undefined;

  const timeout = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

async function settleCatalogQuery<T>(
  factory: () => Promise<T>,
  label: string,
  timeoutMs = 4500
): Promise<PromiseSettledResult<T>> {
  try {
    const value = await withTimeout(factory(), timeoutMs, label);
    return { status: "fulfilled", value };
  } catch (reason) {
    console.warn(`[Catalog] ${label} failed`, reason);
    return { status: "rejected", reason };
  }
}

// ============ CACHE LAYER ============
// Single source of truth: memory cache only (no localStorage for catalog data)
// localStorage caused BFCache + stale data issues on Vercel/Safari
let memoryCache: Record<string, any> = {};
let memoryCacheTime: Record<string, number> = {};
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCache = (key: string): any | null => {
  const val = memoryCache[key];
  const time = memoryCacheTime[key];
  if (val !== undefined && time && Date.now() - time < MEMORY_CACHE_TTL) {
    console.log(`[Cache] Memory hit: ${key} (${Array.isArray(val) ? val.length : '?'} items)`);
    return val;
  }
  return null;
};

const setCache = (key: string, value: any) => {
  if (value === undefined) return;
  memoryCache[key] = value;
  memoryCacheTime[key] = Date.now();
  console.log(`[Cache] Set: ${key} (${Array.isArray(value) ? value.length : '?'} items)`);
};

const deleteCache = (key: string) => {
  delete memoryCache[key];
  delete memoryCacheTime[key];
};

// ============ EXPORTED CACHE UTILITIES ============
export const clearMemoryCache = () => {
  memoryCache = {};
  memoryCacheTime = {};
  console.log('[Cache] Memory cache cleared');
};

export const clearCatalogCaches = (keys: string[] = ["cards", "templates", "categories"]) => {
  for (const key of keys) {
    deleteCache(key);
    // Also clear any filtered template cache keys
    Object.keys(memoryCache).forEach(k => {
      if (k.startsWith(`templates:`)) deleteCache(k);
    });
  }
  console.log("[Cache] Catalog caches cleared:", keys.join(", "));
};

export const warmCatalogCache = async () => {
  const [categories, cards, templates] = await Promise.allSettled([
    fetchAllCategoryNamesFromDB(),
    fetchAllCardsCatalog(),
    fetchAllTempletDesigns(),
  ]);

  return {
    categories: categories.status === "fulfilled" ? categories.value : [],
    cards: cards.status === "fulfilled" ? cards.value : [],
    templates: templates.status === "fulfilled" ? templates.value : [],
  };
};

// ============ SCHEMA HELPERS ============
const CARD_LIST_SELECT_PRIMARY = `
  id,
  cardname,
  cardcategory,
  subCategory,
  subSubCategory,
  imageurl,
  accessplan,
  created_at
`;
const CARD_LIST_SELECT_FALLBACK = "*";

const TEMPLATE_LIST_SELECT_PRIMARY = `
  id,
  title,
  category,
  img_url,
  created_at,
  "subCategory",
  "subSubCategory",
  accessplan
`;

const TEMPLATE_LIST_SELECT_FALLBACK = `
  id,
  title,
  category,
  img_url
`;

const TEMPLATE_POPUP_SELECT_PRIMARY = `
  id,
  title,
  category,
  img_url,
  created_at,
  description,
  sku,
  "subCategory",
  "subSubCategory",
  accessplan,
  actualprice,
  a4price,
  a5price,
  usletter,
  a3price,
  halfusletter,
  ustabloid,
  saleprice,
  salea4price,
  salea5price,
  saleusletter,
  salea3price,
  salehalfusletter,
  saleustabloid
`;

const TEMPLATE_POPUP_SELECT_FALLBACK = `
  id,
  title,
  category,
  img_url,
  description,
  actualprice,
  a4price,
  a5price,
  usletter,
  a3price,
  halfusletter,
  ustabloid,
  saleprice,
  salea4price,
  salea5price,
  saleusletter,
  salea3price,
  salehalfusletter,
  saleustabloid
`;

const isSchemaDriftError = (error: any) => {
  const message = String(error?.message ?? "").toLowerCase();
  return (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
};

const scoreCatalogRow = (row: any) => {
  if (!row || typeof row !== "object") return 0;
  return Object.values(row).reduce((count: number, value) => {
    if (value == null) return count;
    if (typeof value === "string") return value.trim() ? count + 1 : count;
    if (Array.isArray(value)) return value.length ? count + 1 : count;
    if (typeof value === "object") return Object.keys(value).length ? count + 1 : count;
    return count + 1;
  }, 0);
};

const mergeCatalogRows = (primary: any[] | null | undefined, secondary: any[] | null | undefined) => {
  const combined = [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])];
  const byKey = new Map<string, any>();

  combined.forEach((row, index) => {
    const rawId = row?.id ?? row?.card_id ?? row?.slug ?? index;
    const key = String(rawId);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      return;
    }

    const currentScore = scoreCatalogRow(existing);
    const nextScore = scoreCatalogRow(row);
    byKey.set(key, nextScore >= currentScore ? { ...existing, ...row } : { ...row, ...existing });
  });

  return Array.from(byKey.values());
};

const normalizeCatalogToken = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");

const singularCatalogToken = (value: unknown): string => {
  const clean = normalizeCatalogToken(value);
  if (!clean || clean.endsWith("ss")) return clean;
  if (clean.endsWith("ies")) return `${clean.slice(0, -3)}y`;
  if (clean.endsWith("s")) return clean.slice(0, -1);
  return clean;
};

const catalogAliases = (value: unknown): string[] => {
  const clean = normalizeCatalogToken(value);
  const single = singularCatalogToken(value);
  return Array.from(new Set([clean, single].filter(Boolean)));
};

const matchesCatalogCategoryLike = (left: unknown, right: unknown): boolean => {
  const leftKeys = catalogAliases(left);
  const rightKeys = catalogAliases(right);

  if (!leftKeys.length || !rightKeys.length) return false;

  return leftKeys.some((l) =>
    rightKeys.some((r) => l === r || l.includes(r) || r.includes(l))
  );
};

const getTemplateRowCategory = (row: any): string =>
  String(row?.category ?? row?.categoryName ?? row?.templetCategory ?? "").trim();

const getTemplateRowSubCategory = (row: any): string =>
  String(row?.subCategory ?? row?.subcategory ?? "").trim();

const getTemplateRowSubSubCategory = (row: any): string =>
  String(row?.subSubCategory ?? row?.sub_subcategory ?? "").trim();

const filterTemplateRowsLocally = (
  rows: any[] | null | undefined,
  opts?: {
    category?: string | null;
    subCategory?: string | null;
    subSubCategory?: string | null;
  }
) => {
  const normalizedCategory = String(opts?.category ?? "").trim();
  const normalizedSubCategory = normalizeCatalogToken(opts?.subCategory ?? "");
  const normalizedSubSubCategory = normalizeCatalogToken(opts?.subSubCategory ?? "");
  const sourceRows = Array.isArray(rows) ? rows : [];

  return sourceRows.filter((row) => {
    const rowCategory = getTemplateRowCategory(row);
    const rowSubCategory = getTemplateRowSubCategory(row);
    const rowSubSubCategory = getTemplateRowSubSubCategory(row);

    if (
      normalizedCategory &&
      !matchesCatalogCategoryLike(rowCategory, normalizedCategory) &&
      !matchesCatalogCategoryLike(rowSubCategory, normalizedCategory)
    ) {
      return false;
    }

    if (
      normalizedSubCategory &&
      normalizeCatalogToken(rowSubCategory) !== normalizedSubCategory
    ) {
      return false;
    }

    if (
      normalizedSubSubCategory &&
      normalizeCatalogToken(rowSubSubCategory) !== normalizedSubSubCategory
    ) {
      return false;
    }

    return true;
  });
};

const normalizeCategoryRows = (rows: any[]) => {
  const MUG_DEFAULT_SUBS = ["Initials/Name", "Slogans"];
  const MUG_SUBSUB_ALL = [
    "For Her", "For Him", "Age", "Friends", "Kids", "General", "Write your own",
  ];

  return (rows ?? []).map((row: any) => {
    const name = String(row?.name ?? "");
    if (!/mug/i.test(name)) return row;
    const existing = Array.isArray(row?.subcategories) ? row.subcategories : [];
    const lower = new Set(existing.map((v: string) => v.toLowerCase()));
    const merged = [...existing];
    for (const label of MUG_DEFAULT_SUBS) {
      const key = label.toLowerCase();
      if (!lower.has(key)) { merged.push(label); lower.add(key); }
    }
    const subSub = typeof row?.sub_subcategories === "object" && row?.sub_subcategories
      ? { ...row.sub_subcategories } : {};
    for (const parent of MUG_DEFAULT_SUBS) {
      const list = Array.isArray(subSub[parent]) ? subSub[parent] : [];
      const set = new Set(list.map((v: string) => String(v).toLowerCase()));
      const next = [...list];
      for (const label of MUG_SUBSUB_ALL) {
        const key = label.toLowerCase();
        if (!set.has(key)) { next.push(label); set.add(key); }
      }
      subSub[parent] = next;
    }
    return { ...row, subcategories: merged, sub_subcategories: subSub };
  });
};

// ============ CORE FETCH HELPERS ============
const queryCardsCatalogRowsForClient = async (
  client: typeof supabase,
  opts?: { subCategory?: string | null }
) => {
  const normalized = String(opts?.subCategory ?? "").trim();
  let query = client.from("cards").select("*");
  if (normalized) query = query.eq("subCategory", normalized);
  const result = await query.order("id", { ascending: false });
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
};

const fetchCardsCatalogRows = async (opts?: { subCategory?: string | null }) => {
  const useTimeouts = preferPublicCatalogOnly();
  const [publicResult, authResult] = useTimeouts
    ? await Promise.all([
        settleCatalogQuery(() => queryCardsCatalogRowsForClient(supabasePublic, opts), "cards.public"),
        settleCatalogQuery(() => queryCardsCatalogRowsForClient(supabase, opts), "cards.auth"),
      ])
    : await Promise.allSettled([
        queryCardsCatalogRowsForClient(supabasePublic, opts),
        queryCardsCatalogRowsForClient(supabase, opts),
      ]);

  const publicRows = publicResult.status === "fulfilled" ? publicResult.value : [];
  const authRows = authResult.status === "fulfilled" ? authResult.value : [];
  const best = mergeCatalogRows(publicRows, authRows);

  logTiming("Catalog.cards.compare", {
    publicCount: publicRows.length,
    authCount: authRows.length,
    pickedCount: best.length,
    subCategory: String(opts?.subCategory ?? "").trim() || null,
  });

  if (best.length > 0) return best;
  if (publicResult.status === "rejected") throw publicResult.reason;
  if (authResult.status === "rejected") throw authResult.reason;
  return [];
};

// ============ EXPORTED FETCH FUNCTIONS ============

export const fetchAllCardsFromDB = async () => {
  const { data, error } = await supabasePublic.from("cards").select("*");
  if (error) throw new Error(error.message);
  return data;
};

export const fetchAllCardsLight = async () => {
  const { data, error } = await supabasePublic
    .from("cards")
    .select(`
      id,
      cardname,
      cardcategory,
      imageurl,
      accessplan
    `);

  if (error) throw error;
  return data ?? [];
};

export const fetchAllCardsCatalog = async () => {
  const startedAt = startTiming("fetchAllCardsCatalog");
  const cached = getCache('cards');
  if (cached) {
    finishTiming("fetchAllCardsCatalog", startedAt, { count: cached.length, cached: true });
    return cached;
  }

  try {
    const data = await fetchCardsCatalogRows();
    const result = data ?? [];
    setCache('cards', result);
    finishTiming("fetchAllCardsCatalog", startedAt, { count: result.length, cached: false });
    return result;
  } catch (error) {
    console.error("Error fetching cards:", error);
    finishTiming("fetchAllCardsCatalog", startedAt, { error: true });
    return [];
  }
};

export const fetchCardsCatalogBySubCategory = async (subCategory?: string | null) => {
  const normalized = String(subCategory ?? "").trim();
  if (!normalized) return [];
  const startedAt = startTiming("fetchCardsCatalogBySubCategory", { subCategory: normalized });
  const data = await fetchCardsCatalogRows({ subCategory: normalized });
  finishTiming("fetchCardsCatalogBySubCategory", startedAt, { subCategory: normalized, count: data?.length ?? 0 });
  return data ?? [];
};

export const fetchCardPopupById = async (id: string) => {
  const startedAt = startTiming("fetchCardPopupById", { id });
  const result = await supabasePublic.from("cards").select("*").eq("id", id).single();
  if (result.error) throw result.error;
  finishTiming("fetchCardPopupById", startedAt, { id, found: Boolean(result.data) });
  return result.data;
};

export const fetchCardById = async (id: string) => {
  const { data, error } = await supabasePublic.from("cards").select("*").eq("id", id).single();

  if (error) throw error;
  return data;
};

export const fetchAllCategoriesFromDB = async () => {
  const useTimeouts = preferPublicCatalogOnly();
  const [publicResult, authResult] = useTimeouts
    ? await Promise.all([
        settleCatalogQuery(
          () => supabasePublic.from("categories").select("id,name,image_base64,subcategories,sub_subcategories,created_at"),
          "categories.full.public"
        ),
        settleCatalogQuery(
          () => supabase.from("categories").select("id,name,image_base64,subcategories,sub_subcategories,created_at"),
          "categories.full.auth"
        ),
      ])
    : await Promise.allSettled([
        supabasePublic.from("categories").select("id,name,image_base64,subcategories,sub_subcategories,created_at"),
        supabase.from("categories").select("id,name,image_base64,subcategories,sub_subcategories,created_at"),
      ]);

  const publicData = publicResult.status === "fulfilled" && !publicResult.value.error ? publicResult.value.data ?? [] : [];
  const authData = authResult.status === "fulfilled" && !authResult.value.error ? authResult.value.data ?? [] : [];
  const data = mergeCatalogRows(publicData, authData);

  if (!data.length) {
    if (publicResult.status === "fulfilled" && publicResult.value.error) throw new Error(publicResult.value.error.message);
    if (authResult.status === "fulfilled" && authResult.value.error) throw new Error(authResult.value.error.message);
  }

  const normalized = normalizeCategoryRows(data ?? []);
  return normalized.slice().sort((a: any, b: any) =>
    String(a?.name ?? "").localeCompare(String(b?.name ?? ""), undefined, { sensitivity: "base", numeric: true })
  );
};

export const fetchAllCategoryNamesFromDB = async () => {
  const cached = getCache('categories');
  if (cached) return cached;

  try {
    const useTimeouts = preferPublicCatalogOnly();
    const [publicResult, authResult] = useTimeouts
      ? await Promise.all([
          settleCatalogQuery(
            () => supabasePublic.from("categories").select("id,name").order("name", { ascending: true }),
            "categories.names.public"
          ),
          settleCatalogQuery(
            () => supabase.from("categories").select("id,name").order("name", { ascending: true }),
            "categories.names.auth"
          ),
        ])
      : await Promise.allSettled([
          supabasePublic.from("categories").select("id,name").order("name", { ascending: true }),
          supabase.from("categories").select("id,name").order("name", { ascending: true }),
        ]);

    const publicData = publicResult.status === "fulfilled" && !publicResult.value.error ? publicResult.value.data ?? [] : [];
    const authData = authResult.status === "fulfilled" && !authResult.value.error ? authResult.value.data ?? [] : [];
    const data = mergeCatalogRows(publicData, authData);

    setCache('categories', data ?? []);
    return data ?? [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

export const fetchCardsCategoryMeta = async () => {
  const useTimeouts = preferPublicCatalogOnly();
  const [publicResult, authResult] = useTimeouts
    ? await Promise.all([
        settleCatalogQuery(
          () => supabasePublic.from("categories").select("id,name,subcategories,sub_subcategories").eq("name", "Cards").maybeSingle(),
          "categories.cardsMeta.public"
        ),
        settleCatalogQuery(
          () => supabase.from("categories").select("id,name,subcategories,sub_subcategories").eq("name", "Cards").maybeSingle(),
          "categories.cardsMeta.auth"
        ),
      ])
    : await Promise.allSettled([
        supabasePublic.from("categories").select("id,name,subcategories,sub_subcategories").eq("name", "Cards").maybeSingle(),
        supabase.from("categories").select("id,name,subcategories,sub_subcategories").eq("name", "Cards").maybeSingle(),
      ]);

  const publicData = publicResult.status === "fulfilled" && !publicResult.value.error ? publicResult.value.data ?? null : null;
  const authData = authResult.status === "fulfilled" && !authResult.value.error ? authResult.value.data ?? null : null;
  return authData ?? publicData ?? null;
};

export const fetchCardCount = async () => {
  const { count, error } = await supabasePublic.from("cards").select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count;
};

export const fetchAllUsersFromDB = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from("Users")
    .select(["id","name","full_name","display_name","email","created_at","createdAt","profileUrl","avatar_url","photo_url","image","image_base64","user_metadata","identity_data","raw_user_meta_data","provider","auth_provider","plan","subscription_plan","code","isPremium","premium_expires_at","isBundle","hasBundle","bundle_expires_at","bundleExpiresAt","bundle_expiry","bundle_expire_at"].join(","))
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []);
};

export const deleteUserById = async (id: number | string) => {
  const { error } = await supabase.from("Users").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return id;
};

export const fetchAllOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select("id,session_id,user_name,user_email,created_at,card_size,status,amount")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

export const fetchOrderCount = async () => {
  const { count, error } = await supabase.from("orders").select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count;
};

export async function fetchMyOrders() {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw new Error(userErr.message);
  const user = userRes?.user;
  if (!user?.id) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("orders")
    .select("id,user_id,session_id,payer_name,payer_email,currency,amount,status,preview_image,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []);
}

export const fetchAllBlogs = async () => {
  const { data, error } = await supabase.from("blogs").select("id,title,image_base64,created_at").order("created_at", { ascending: false });
  if (error) { toast.error("Error fetching blogs:"); return []; }
  return data || [];
};

export async function fetchBlogByParam(param: string): Promise<any | null> {
  if (!param) return null;
  const isNumeric = /^[0-9]+$/.test(param);
  if (isNumeric) {
    const { data, error } = await supabase.from("blogs").select("id,slug,title,content_html").eq("id", Number(param)).single();
    if (!error && data) return data;
  }
  { const { data, error } = await supabase.from("blogs").select("id,slug,title,content_html").eq("id", param).single(); if (!error && data) return data; }
  { const { data, error } = await supabase.from("blogs").select("id,slug,title,content_html").eq("slug", param).single(); if (!error && data) return data; }
  return null;
}

export const fetchAllTempletDesigns = async (): Promise<any[]> => {
  const startedAt = startTiming("fetchAllTempletDesigns");
  const cached = getCache('templates');
  if (cached) {
    finishTiming("fetchAllTempletDesigns", startedAt, { count: cached.length, cached: true });
    return cached;
  }

  try {
    const queryForClient = async (client: typeof supabase) => {
      const primary = await client
        .from("templetDesign")
        .select(TEMPLATE_LIST_SELECT_PRIMARY)
        .order("created_at", { ascending: false });

      if (!primary.error) return primary.data ?? [];
      if (!isSchemaDriftError(primary.error)) throw primary.error;

      const fallback = await client
        .from("templetDesign")
        .select(TEMPLATE_LIST_SELECT_FALLBACK)
        .order("created_at", { ascending: false });

      if (fallback.error) throw fallback.error;
      return fallback.data ?? [];
    };

    const useTimeouts = preferPublicCatalogOnly();
    const [publicResult, authResult] = useTimeouts
      ? await Promise.all([
          settleCatalogQuery(() => queryForClient(supabasePublic), "templates.public"),
          settleCatalogQuery(() => queryForClient(supabase), "templates.auth"),
        ])
      : await Promise.allSettled([
          queryForClient(supabasePublic),
          queryForClient(supabase),
        ]);

    const publicData = publicResult.status === "fulfilled" ? publicResult.value : [];
    const authData = authResult.status === "fulfilled" ? authResult.value : [];
    const best = mergeCatalogRows(publicData, authData);

    logTiming("Catalog.templates.compare", {
      publicCount: publicData.length,
      authCount: authData.length,
      pickedCount: best.length,
    });

    const result = best.length > 0 ? best : [];
    setCache('templates', result);
    finishTiming("fetchAllTempletDesigns", startedAt, { count: result.length, cached: false });
    return result;
  } catch (error) {
    console.error("Error fetching templates:", error);
    finishTiming("fetchAllTempletDesigns", startedAt, { error: true });
    return [];
  }
};

const queryTemplateRowsForClient = async (
  client: typeof supabase,
  opts?: { category?: string | null; subCategory?: string | null; subSubCategory?: string | null; }
) => {
  const normalizedCategory = String(opts?.category ?? "").trim();
  const normalizedSubCategory = String(opts?.subCategory ?? "").trim();
  const normalizedSubSubCategory = String(opts?.subSubCategory ?? "").trim();

  const buildQuery = (selectClause: string) => {
    let query = client.from("templetDesign").select(selectClause);
    if (normalizedCategory) query = query.eq("category", normalizedCategory);
    if (normalizedSubCategory) query = query.eq("subCategory", normalizedSubCategory);
    if (normalizedSubSubCategory) query = query.eq("subSubCategory", normalizedSubSubCategory);
    return query.order("created_at", { ascending: false });
  };

  const primary = await buildQuery(TEMPLATE_LIST_SELECT_PRIMARY);
  if (!primary.error) return primary.data ?? [];
  if (!isSchemaDriftError(primary.error)) throw primary.error;

  const fallback = await buildQuery(TEMPLATE_LIST_SELECT_FALLBACK);
  if (fallback.error) throw fallback.error;
  return fallback.data ?? [];
};

export const fetchTempletDesignsByCategory = async (opts?: {
  category?: string | null;
  subCategory?: string | null;
  subSubCategory?: string | null;
}): Promise<any[]> => {
  const startedAt = startTiming("fetchTempletDesignsByCategory", {
    category: String(opts?.category ?? "").trim() || null,
    subCategory: String(opts?.subCategory ?? "").trim() || null,
    subSubCategory: String(opts?.subSubCategory ?? "").trim() || null,
  });

  const useTimeouts = preferPublicCatalogOnly();
  const [publicResult, authResult] = useTimeouts
    ? await Promise.all([
        settleCatalogQuery(() => queryTemplateRowsForClient(supabasePublic, opts), "templates.filtered.public"),
        settleCatalogQuery(() => queryTemplateRowsForClient(supabase, opts), "templates.filtered.auth"),
      ])
    : await Promise.allSettled([
        queryTemplateRowsForClient(supabasePublic, opts),
        queryTemplateRowsForClient(supabase, opts),
      ]);

  const publicData = publicResult.status === "fulfilled" ? publicResult.value : [];
  const authData = authResult.status === "fulfilled" ? authResult.value : [];
  const best = mergeCatalogRows(publicData, authData);

  finishTiming("fetchTempletDesignsByCategory", startedAt, { count: best.length });

  if (best.length > 0) return best;

  // Local fallback from full cache
  const needsLocalFallback = Boolean(
    String(opts?.category ?? "").trim() || String(opts?.subCategory ?? "").trim() || String(opts?.subSubCategory ?? "").trim()
  );

  if (needsLocalFallback) {
    try {
      const allTemplates = await fetchAllTempletDesigns();
      const locallyFiltered = filterTemplateRowsLocally(allTemplates, opts);
      if (locallyFiltered.length > 0) return locallyFiltered;
    } catch (e) {
      console.warn("Local template filter fallback failed", e);
    }
  }

  if (publicResult.status === "rejected") throw publicResult.reason;
  if (authResult.status === "rejected") throw authResult.reason;
  return [];
};

export const fetchTempletCardCount = async () => {
  const { count, error } = await supabaseAdmin.from("templetDesign").select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
};

export const fetchTempletDesignById = async (id: string) => {
  const { data, error } = await supabaseAdmin
    .from("templetDesign")
    .select(`
      id,
      category,
      slides,
      created_at
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

export const fetchTempletPopupById = async (id: string | number) => {
  const result = await supabasePublic.from("templetDesign").select("*").eq("id", id).single();
  if (result.error) throw result.error;
  return result.data;
};

export const fetchTempletDesignFullById = async (id: string | number) => {
  const { data, error } = await supabaseAdmin.from("templetDesign").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ?? null;
};

export const fetchTempletRawStoresById = async (id: string | number) => {
  const { data, error } = await supabaseAdmin.from("templetDesign").select("id, raw_stores").eq("id", id).single();
  if (error) throw error;
  return data;
};

export const fetchDraftByCardId = async (cardId: string) => {
  const { data, error } = await supabase
    .from("draft")
    .select("card_id,cover_screenshot,title,category,description,layout,slide1,slide2,slide3,slide4,selected_size,prices,display_price,is_on_sale,updated_at,user_id")
    .eq("card_id", cardId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
};

export async function fetchAllBundlesFromDB(): Promise<any> {
  const { data, error } = await supabase
    .from("bundles")
    .select("id,name,image_base64,main_category,sub_categories,sub_sub_categories,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    image_base64: r.image_base64 ?? null,
    main_category: r.main_category ?? "",
    sub_categories: Array.isArray(r.sub_categories) ? r.sub_categories : [],
    sub_sub_categories: Array.isArray(r.sub_sub_categories) ? r.sub_sub_categories : [],
    created_at: r.created_at,
  }));
}

export async function saveBlog({ title, content_html, meta = {} }: { title: string; content_html: string; meta?: any; }) {
  if (!title?.trim()) throw new Error('Title is required');
  if (!content_html?.trim()) throw new Error('HTML content is required');
  const { data, error } = await supabase.from('blogs').insert([{ title, content_html, meta }]).select().single();
  if (error) throw error;
  toast.success("Blogs is Added");
  return data;
}

export async function submitBlog({ title, html, meta }: { title: string; html: string; meta: any; }) {
  return saveBlog({ title, content_html: html, meta });
}

export async function updateBlog(id: string, input: { title: string; content_html: string; meta?: any; }): Promise<any> {
  const { data, error } = await supabase.from('blogs').update({ title: input.title, content_html: input.content_html, meta: input.meta ?? {} }).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBlog(id: string): Promise<void> {
  const { error } = await supabase.from('blogs').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBlogById(id: string): Promise<any> {
  if (!id || typeof id !== 'string') throw new Error('fetchBlogById: id is required');
  const { data, error } = await supabase.from('blogs').select('id,title,content_html,meta').eq('id', id).single();
  if (error) throw new Error(error.message || 'Failed to fetch blog');
  return data;
}

export async function saveTutorial(input: any): Promise<any> {
  const { data, error } = await supabase.from('tutorials').insert([input]).select().single();
  toast.success("Toturial is save successfully");
  if (error) throw new Error(error.message || 'Failed to save tutorial');
  return data;
}

export async function updateTutorial(id: string, input: any): Promise<any> {
  const { data, error } = await supabase.from('tutorials').update(input).eq('id', id).select().single();
  toast.success("Updated Toturial is Successfully");
  if (error) throw new Error(error.message || 'Failed to update tutorial');
  return data as any;
}

export async function deleteTutorial(id: string): Promise<void> {
  const { data, error } = await supabase.from('tutorials').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete tutorial');
}

export async function fetchAllTutorials(): Promise<any[]> {
  const { data, error } = await supabase.from('tutorials').select('id,title,youtube_url,thumbnail_base64,created_at').order('created_at', { ascending: false });
  if (error) throw new Error(error.message || 'Failed to fetch tutorials');
  return (data ?? []) as any[];
}

export async function fileToBase64Url(file: File): Promise<string> {
  return await new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}
