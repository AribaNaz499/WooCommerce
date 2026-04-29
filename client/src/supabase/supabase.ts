import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigError =
  "Missing Supabase env: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required.";

const memorySessionStore = new Map<string, string>();

const readBrowserStorage = (key: string) => {
  if (typeof window === "undefined") return memorySessionStore.get(key) ?? null;
  try {
    const localValue = window.localStorage.getItem(key);
    if (localValue != null) return localValue;
  } catch {}
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return memorySessionStore.get(key) ?? null;
  }
};

const writeBrowserStorage = (key: string, value: string) => {
  if (typeof window === "undefined") {
    memorySessionStore.set(key, value);
    return;
  }
  let wrote = false;
  try {
    window.localStorage.setItem(key, value);
    wrote = true;
  } catch {}
  try {
    window.sessionStorage.setItem(key, value);
    wrote = true;
  } catch {}
  if (!wrote) {
    memorySessionStore.set(key, value);
  }
};

const removeBrowserStorage = (key: string) => {
  if (typeof window === "undefined") {
    memorySessionStore.delete(key);
    return;
  }
  try {
    window.localStorage.removeItem(key);
  } catch {}
  try {
    window.sessionStorage.removeItem(key);
  } catch {}
  memorySessionStore.delete(key);
};

const createSessionStorageAdapter = () => ({
  getItem: (key: string) => {
    return readBrowserStorage(key);
  },
  setItem: (key: string, value: string) => {
    writeBrowserStorage(key, value);
  },
  removeItem: (key: string) => {
    removeBrowserStorage(key);
  },
});

const authSessionStorage = createSessionStorageAdapter();

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        storage: authSessionStorage,
        storageKey: "diy-auth",
      },
    })
  : (null as any);

export const supabasePublic = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: "diy-public-catalog",
      },
    })
  : (null as any);

if (!isSupabaseConfigured && typeof window !== "undefined") {
  console.warn(supabaseConfigError);
}

// Browser bundle must never expose service-role credentials.
// Keep the symbol for compatibility; move privileged operations to server/edge functions.
export const supabaseAdmin = supabase;
