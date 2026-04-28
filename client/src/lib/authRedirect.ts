const KEY = "post_login_redirect_v1";
const FLOW_KEY = "post_login_redirect_flow_v1";
const COOKIE_KEY = `${KEY}_cookie`;
const FLOW_COOKIE_KEY = `${FLOW_KEY}_cookie`;
const ROOT_REDIRECT_PARAM = "post_login_redirect";
const WINDOW_NAME_PREFIX = "diy-auth-redirect:";
const FLOW_WINDOW_NAME_PREFIX = "diy-auth-redirect-flow:";
const AUTH_PATHS = new Set(["/signin", "/signup"]);

const encodeCookieValue = (value: string) => encodeURIComponent(value);
const decodeCookieValue = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const readCookie = (name: string) => {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!cookie) return null;
  return decodeCookieValue(cookie.slice(prefix.length));
};

const writeCookie = (name: string, value: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeCookieValue(value)}; path=/; max-age=1800; SameSite=Lax`;
};

const clearCookie = (name: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

export type PendingAuthRedirect = {
  path: string;
  state?: any;
  createdAt?: number;
  autoResume?: boolean;
};

const normalizePathLike = (value?: string | null): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  try {
    if (/^https?:\/\//i.test(raw)) {
      const base = typeof window !== "undefined" ? window.location.origin : "https://diypersonalisation.com";
      const url = new URL(raw, base);
      const baseUrl = new URL(base);
      if (url.origin !== baseUrl.origin) return "/";
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {}

  if (raw.startsWith("/")) return raw;
  return raw.startsWith("?") || raw.startsWith("#") ? `/${raw}` : `/${raw}`;
};

export const normalizeAuthRedirectPath = (value?: string | null): string => {
  const raw = normalizePathLike(value);
  if (!raw) return "/";

  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://diypersonalisation.com";
    const url = new URL(raw, base);
    const pathname = url.pathname || "/";
    const redirectParam =
      url.searchParams.get("redirect")?.trim() ||
      url.searchParams.get(ROOT_REDIRECT_PARAM)?.trim() ||
      "";

    if (AUTH_PATHS.has(pathname)) {
      return redirectParam ? normalizeAuthRedirectPath(redirectParam) : "/";
    }

    if (
      pathname === "/" &&
      (url.searchParams.has("code") ||
        url.searchParams.has("access_token") ||
        url.hash.includes("access_token") ||
        url.hash.includes("refresh_token"))
    ) {
      return redirectParam ? normalizeAuthRedirectPath(redirectParam) : "/";
    }

    return `${pathname}${url.search}${url.hash}` || "/";
  } catch {
    return raw || "/";
  }
};

export const savePendingAuthRedirect = (payload: PendingAuthRedirect) => {
  const normalizedPath = normalizeAuthRedirectPath(payload.path);
  const serialized = JSON.stringify({
    ...payload,
    path: normalizedPath,
    createdAt: typeof payload.createdAt === "number" ? payload.createdAt : Date.now(),
  });
  try {
    sessionStorage.setItem(KEY, serialized);
  } catch {}
  try {
    localStorage.setItem(KEY, serialized);
  } catch {}
  try {
    writeCookie(COOKIE_KEY, serialized);
  } catch {}
  try {
    if (typeof window !== "undefined") {
      window.name = `${WINDOW_NAME_PREFIX}${serialized}`;
    }
  } catch {}

  const flowValue = payload.autoResume === true ? "1" : "";
  try {
    if (flowValue) {
      sessionStorage.setItem(FLOW_KEY, flowValue);
    } else {
      sessionStorage.removeItem(FLOW_KEY);
    }
  } catch {}
  try {
    if (flowValue) {
      localStorage.setItem(FLOW_KEY, flowValue);
    } else {
      localStorage.removeItem(FLOW_KEY);
    }
  } catch {}
  try {
    if (flowValue) {
      writeCookie(FLOW_COOKIE_KEY, flowValue);
    } else {
      clearCookie(FLOW_COOKIE_KEY);
    }
  } catch {}
  try {
    if (typeof window !== "undefined") {
      const existingName = window.name.startsWith(FLOW_WINDOW_NAME_PREFIX)
        ? window.name.split("|").slice(1).join("|")
        : window.name;
      if (flowValue) {
        window.name = `${FLOW_WINDOW_NAME_PREFIX}${flowValue}|${existingName}`;
      } else if (window.name.startsWith(FLOW_WINDOW_NAME_PREFIX)) {
        window.name = existingName;
      }
    }
  } catch {}
};

export const getAuthReturnPath = (locationLike?: {
  pathname?: string | null;
  search?: string | null;
  hash?: string | null;
}) => {
  const pathname = locationLike?.pathname?.trim() || "/";
  const search = locationLike?.search?.trim() || "";
  const hash = locationLike?.hash?.trim() || "";
  return `${pathname}${search}${hash}`;
};

export const buildSignInRedirectUrl = (returnPath?: string | null) => {
  const nextPath = normalizeAuthRedirectPath(returnPath);
  return `/signin?redirect=${encodeURIComponent(nextPath)}`;
};

export const buildOAuthCallbackUrl = (returnPath?: string | null) => {
  const nextPath = normalizeAuthRedirectPath(returnPath);

  if (typeof window === "undefined") {
    return `https://diypersonalisation.com/?${ROOT_REDIRECT_PARAM}=${encodeURIComponent(nextPath)}`;
  }

  const url = new URL("/", window.location.origin);
  url.searchParams.set(ROOT_REDIRECT_PARAM, nextPath);
  url.searchParams.set("redirect", nextPath);
  return url.toString();
};

export const buildSignInCallbackUrl = (returnPath?: string | null) => {
  const nextPath = normalizeAuthRedirectPath(returnPath);

  if (typeof window === "undefined") {
    return `https://diypersonalisation.com/signin?redirect=${encodeURIComponent(nextPath)}`;
  }

  const url = new URL("/signin", window.location.origin);
  url.searchParams.set("redirect", nextPath);
  return url.toString();
};

export const readSignInRedirectParam = (search?: string | null) => {
  const source =
    typeof search === "string"
      ? search
      : typeof window !== "undefined"
      ? window.location.search
      : "";
  const value = new URLSearchParams(source).get("redirect")?.trim() || "";
  return value ? normalizeAuthRedirectPath(value) : null;
};

export const readRootRedirectParam = (search?: string | null) => {
  const source =
    typeof search === "string"
      ? search
      : typeof window !== "undefined"
      ? window.location.search
      : "";
  const value = new URLSearchParams(source).get(ROOT_REDIRECT_PARAM)?.trim() || "";
  return value ? normalizeAuthRedirectPath(value) : null;
};

export const readPendingAuthRedirect = (): PendingAuthRedirect | null => {
  const parse = (raw: string | null): PendingAuthRedirect | null => {
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.path !== "string" || !parsed.path.trim()) return null;
    return {
      path: normalizeAuthRedirectPath(parsed.path),
      state: parsed.state ?? null,
      autoResume: parsed.autoResume === true,
      createdAt:
        typeof parsed.createdAt === "number" && Number.isFinite(parsed.createdAt)
          ? parsed.createdAt
          : undefined,
    };
  };

  try {
    const sessionValue = parse(sessionStorage.getItem(KEY));
    if (sessionValue) return sessionValue;
  } catch {
  }

  try {
    const localValue = parse(localStorage.getItem(KEY));
    if (localValue) return localValue;
  } catch {
  }

  try {
    const cookieValue = parse(readCookie(COOKIE_KEY));
    if (cookieValue) return cookieValue;
  } catch {
  }

  try {
    if (typeof window !== "undefined" && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      const windowValue = parse(window.name.slice(WINDOW_NAME_PREFIX.length));
      if (windowValue) return windowValue;
    }
  } catch {}

  return null;
};

export const hasPendingAuthResumeMarker = () => {
  try {
    if (sessionStorage.getItem(FLOW_KEY) === "1") return true;
  } catch {}
  try {
    if (localStorage.getItem(FLOW_KEY) === "1") return true;
  } catch {}
  try {
    if (readCookie(FLOW_COOKIE_KEY) === "1") return true;
  } catch {}
  try {
    if (typeof window !== "undefined" && window.name.startsWith(FLOW_WINDOW_NAME_PREFIX)) {
      return true;
    }
  } catch {}
  return false;
};

export const clearPendingAuthRedirect = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
  try {
    sessionStorage.removeItem(FLOW_KEY);
  } catch {}
  try {
    localStorage.removeItem(KEY);
  } catch {}
  try {
    localStorage.removeItem(FLOW_KEY);
  } catch {}
  try {
    clearCookie(COOKIE_KEY);
  } catch {}
  try {
    clearCookie(FLOW_COOKIE_KEY);
  } catch {}
  try {
    if (typeof window !== "undefined" && window.name.startsWith(WINDOW_NAME_PREFIX)) {
      window.name = "";
    }
  } catch {}
  try {
    if (typeof window !== "undefined" && window.name.startsWith(FLOW_WINDOW_NAME_PREFIX)) {
      window.name = window.name.split("|").slice(1).join("|");
    }
  } catch {}
};
