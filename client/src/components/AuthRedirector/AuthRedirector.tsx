import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  clearPendingAuthRedirect,
  readPendingAuthRedirect,
  readRootRedirectParam,
  readSignInRedirectParam,
  savePendingAuthRedirect,
} from "../../lib/authRedirect";
import { USER_ROUTES } from "../../constant/route";

const PENDING_TTL_MS = 1000 * 60 * 15;

const log = (...args: any[]) => {
  const line = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
    .join(" ");
  console.log("[AuthRedirector]", line);
};

function hasOAuthCallbackSignal(location: {
  hash: string;
  search: string;
}): boolean {
  const params = new URLSearchParams(location.search);
  return (
    params.has("code") ||
    params.has("post_login_redirect") ||
    params.has("redirect") ||
    params.has("access_token") ||
    location.hash.includes("access_token") ||
    location.hash.includes("refresh_token")
  );
}

function getLiveLocationSnapshot(location: {
  pathname: string;
  search: string;
  hash: string;
}) {
  if (typeof window === "undefined") return location;
  return {
    pathname: window.location.pathname || location.pathname,
    search: window.location.search || location.search,
    hash: window.location.hash || location.hash,
  };
}

function resolveTargetPath(locationSearch: string) {
  const pending = readPendingAuthRedirect();
  const rootRedirect = readRootRedirectParam(locationSearch);
  const signInRedirect = readSignInRedirectParam(locationSearch);

  const paramPath = rootRedirect || signInRedirect || null;
  if (!pending?.path && paramPath && paramPath !== "/") {
    try {
      savePendingAuthRedirect({ path: paramPath, autoResume: true });
    } catch {}
  }

  log(
    "resolve -> pending:",
    pending?.path ?? "null",
    "| rootRedirect:",
    rootRedirect ?? "null",
    "| signInRedirect:",
    signInRedirect ?? "null",
    "| pendingAge:",
    pending?.createdAt ? Date.now() - pending.createdAt : "n/a"
  );

  const pendingPath =
    pending?.autoResume === true &&
    typeof pending?.path === "string" &&
    pending.path.trim() &&
    pending.path.trim() !== "/"
      ? pending.path.trim()
      : null;
  const path = paramPath || pendingPath || null;
  return { path, pending };
}

const AuthRedirector = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const didRedirect = useRef(false);
  const sawOAuthCallbackSignal = useRef(false);

  useEffect(() => {
    const liveLocation = getLiveLocationSnapshot(location);
    const immediateCallbackSignal = hasOAuthCallbackSignal(liveLocation);
    if (immediateCallbackSignal) {
      sawOAuthCallbackSignal.current = true;
    }
    const callbackSignal = immediateCallbackSignal || sawOAuthCallbackSignal.current;

    log(
      "E2 | path:",
      liveLocation.pathname,
      "| search:",
      liveLocation.search,
      "| hash:",
      liveLocation.hash.slice(0, 60)
    );

    if (liveLocation.pathname !== "/") return;
    if (didRedirect.current) {
      log("E2 | already redirected");
      return;
    }

    const { path: targetPath, pending } = resolveTargetPath(liveLocation.search);

    if (!targetPath || targetPath === "/") {
      if (!callbackSignal) {
        clearPendingAuthRedirect();
      }
      log("E2 | no targetPath -> bail");
      return;
    }

    const pendingAgeMs =
      typeof pending?.createdAt === "number"
        ? Date.now() - pending.createdAt
        : Number.POSITIVE_INFINITY;
    const isFreshPending =
      Number.isFinite(pendingAgeMs) && pendingAgeMs >= 0 && pendingAgeMs < PENDING_TTL_MS;
    const hasExplicitRedirectParam = Boolean(
      readRootRedirectParam(liveLocation.search) || readSignInRedirectParam(liveLocation.search)
    );
    log("E2 | signal:", callbackSignal, "| freshPending:", isFreshPending, "| ageMs:", pendingAgeMs);

    if (!callbackSignal && !hasExplicitRedirectParam) {
      clearPendingAuthRedirect();
      log("E2 | plain home visit -> cleared pending and bail");
      return;
    }

    // Let AuthProvider finish processing OAuth hash/code first.
    // Redirecting away from "/" too early drops the callback tokens before
    // Supabase restores the signed-in session, which causes the login loop.
    if (callbackSignal || loading) {
      log("E2 | waiting for auth callback/session restore");
      return;
    }

    if (!callbackSignal && !isFreshPending) {
      log("E2 | no signal & not fresh -> bail");
      return;
    }

    log("E2 | REDIRECT ->", targetPath);
    didRedirect.current = true;
    clearPendingAuthRedirect();
    window.location.replace(new URL(targetPath, window.location.origin).toString());
  }, [loading, location.hash, location.pathname, location.search]);

  useEffect(() => {
    const liveLocation = getLiveLocationSnapshot(location);
    log("E3 | loading:", loading, "| user:", user?.id ?? "null", "| path:", liveLocation.pathname);

    if (loading || !user) return;
    if (didRedirect.current) {
      log("E3 | already redirected");
      return;
    }

    const { path: targetPath, pending } = resolveTargetPath(liveLocation.search);

    if (!targetPath || targetPath === "/") {
      if (!hasOAuthCallbackSignal(liveLocation)) {
        clearPendingAuthRedirect();
      }
      log("E3 | no targetPath -> bail");
      return;
    }

    const isOnSignin = liveLocation.pathname === USER_ROUTES.SIGNIN;
    const isOnRoot = liveLocation.pathname === "/";
    const callbackSignal = hasOAuthCallbackSignal(liveLocation) || sawOAuthCallbackSignal.current;
    const rootRedirect = readRootRedirectParam(liveLocation.search);
    const signInRedirect = readSignInRedirectParam(liveLocation.search);
    const hasExplicitRedirectParam = Boolean(rootRedirect || signInRedirect);

    log("E3 | isOnSignin:", isOnSignin, "| isOnRoot:", isOnRoot);

    if (!isOnSignin && !isOnRoot) {
      log("E3 | not on signin/root -> bail");
      return;
    }

    if (isOnRoot && !callbackSignal && !hasExplicitRedirectParam) {
      log("E3 | plain root visit -> bail");
      clearPendingAuthRedirect();
      return;
    }

    log("E3 | REDIRECT ->", targetPath, "| state:", pending?.state);
    didRedirect.current = true;
    clearPendingAuthRedirect();

    if (isOnRoot) {
      window.location.replace(new URL(targetPath, window.location.origin).toString());
      return;
    }

    // ✅ SAFARI FIX: pending.state mein focusProductId/focusProductType hota hai
    // Safari mein React Router ka navigate() state kabhi kabhi survive nahi karta
    // window.location.replace() use karna padta hai taake state localStorage se
    // ViewAllCard mein readPendingAuthRedirect() ke zariye mile
    // Lekin agar already pending mein state hai toh navigate() bhi theek hai
    // kyunki hum ne authRedirect.ts mein 4 jagah save kiya hai (session, local, cookie, window.name)
    navigate(targetPath, {
      replace: true,
      state: {
        ...(pending?.state ?? {}),
      },
    });
  }, [loading, location.pathname, location.search, navigate, user]);

  return null;
};

export default AuthRedirector;
