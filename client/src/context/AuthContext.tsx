/* ========================================================================== */
/* FILE: src/context/AuthContext.tsx                                          */
/* ========================================================================== */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase/supabase";
import toast from "react-hot-toast";
import {
  buildOAuthCallbackUrl,
  clearPendingAuthRedirect,
  readPendingAuthRedirect,
} from "../lib/authRedirect";
import { USER_ROUTES } from "../constant/route";
import { isIosTouchDevice, isSafariBrowser } from "../lib/platform";
import { clearCatalogCaches, clearMemoryCache } from "../source/source";
import { QueryClient } from "@tanstack/react-query";

let _queryClient: QueryClient | null = null;
export const setAuthQueryClient = (qc: QueryClient) => {
  _queryClient = qc;
};

// ✅ FIX: Use 'active' refetchType so queries actually re-fetch immediately,
// not just get marked stale. This fixes the "data missing after sign-in" bug
// on Vercel where staleTime kept preventing re-fetches.
const invalidateCatalogQueries = () => {
  // Always clear memory cache first so next fetch goes to network
  clearCatalogCaches();

  if (!_queryClient) {
    console.warn("[AuthContext] queryClient not registered - call setAuthQueryClient() in App.tsx");
    return;
  }

  console.log("[AuthContext] Invalidating + refetching catalog queries after auth change");

  // Remove cached query data entirely, forcing fresh fetch on next access
  _queryClient.removeQueries({ queryKey: ["cards"] });
  _queryClient.removeQueries({ queryKey: ["templates"] });
  _queryClient.removeQueries({ queryKey: ["categories"] });
  _queryClient.removeQueries({ queryKey: ["navCategories"] });

  // Also invalidate any filtered template queries
  _queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "templates" });
};

interface SignUpInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

interface SignInInput {
  email: string;
  password: string;
}

export type PlanCode = "free" | "bundle" | "pro";

export type UserProfileRow = {
  id?: string | number;
  auth_id: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  profileUrl?: string | null;
  published?: boolean | null;
  isPremium?: boolean | null;
  premium_expires_at?: string | null;
  plan_code?: PlanCode | string | null;
  bundle_expires_at?: string | null;
  bundle_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  updated_at?: string | null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfileRow | null;
  loading: boolean;
  plan: PlanCode;
  premiumActive: boolean;
  bundleActive: boolean;
  premiumExpiresAt: string | null;
  bundleExpiresAt: string | null;
  signUp: (input: SignUpInput) => Promise<any>;
  signIn: (input: SignInInput) => Promise<any>;
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getOAuthAvatar(user: User | null): string {
  const u: any = user;
  return (
    u?.user_metadata?.avatar_url ||
    u?.user_metadata?.picture ||
    u?.identities?.[0]?.identity_data?.avatar_url ||
    u?.identities?.[0]?.identity_data?.picture ||
    ""
  );
}

function buildOptimisticProfile(authUser: User): UserProfileRow {
  const meta: any = authUser.user_metadata ?? {};
  return {
    auth_id: authUser.id,
    full_name: meta?.full_name || meta?.name || authUser.email || "",
    email: authUser.email ?? null,
    phone: meta?.phone || null,
    profileUrl: getOAuthAvatar(authUser) || null,
  };
}

function computePremiumActive(profile: UserProfileRow | null): boolean {
  if (!profile?.isPremium) return false;
  const expiresAt = profile.premium_expires_at;
  if (!expiresAt) return true;
  const t = new Date(expiresAt).getTime();
  if (!Number.isFinite(t)) return Boolean(profile.isPremium);
  return t > Date.now();
}

function computeBundleActive(profile: UserProfileRow | null): boolean {
  const expiresAt = profile?.bundle_expires_at;
  if (!expiresAt) return false;
  const t = new Date(expiresAt).getTime();
  if (!Number.isFinite(t)) return false;
  return t > Date.now();
}

function computePlan(profile: UserProfileRow | null): PlanCode {
  const raw = String(profile?.plan_code ?? "").toLowerCase().trim();
  if (raw === "pro") return "pro";
  if (raw === "bundle") return "bundle";
  if (raw === "free") return "free";
  if (computePremiumActive(profile)) return "pro";
  if (computeBundleActive(profile)) return "bundle";
  return "free";
}

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/`
      : "https://diypersonalisation.com/";

  const fetchProfile = async (authId: string) => {
    const { data, error } = await supabase
      .from("Users")
      .select(
        ["id", "auth_id", "full_name", "phone", "email", "profileUrl", "published",
          "isPremium", "premium_expires_at",
          "plan_code", "bundle_expires_at", "bundle_subscription_id",
          "stripe_customer_id", "stripe_subscription_id", "updated_at",
        ].join(",")
      )
      .eq("auth_id", authId)
      .maybeSingle();
    if (error) throw error;
    setProfile((data as any) ?? null);
    return (data as any) ?? null;
  };

  const upsertUser = async (authUser: User) => {
    const meta: any = authUser.user_metadata ?? {};
    const avatar = getOAuthAvatar(authUser);
    const payload: Partial<UserProfileRow> = {
      auth_id: authUser.id,
      full_name: meta?.full_name || meta?.name || "",
      email: authUser.email ?? null,
      phone: meta?.phone || null,
      profileUrl: avatar || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("Users").upsert([payload], { onConflict: "auth_id" });
    if (error) console.error("Upsert user error:", error);
  };

  const refreshUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    setUser(data.user ?? null);
  };

  const refreshProfile = async () => {
    const authId = user?.id;
    if (!authId) { setProfile(null); return; }
    await fetchProfile(authId);
  };

  const syncUserData = async (authUser: User) => {
    try {
      setProfile((current) => current ?? buildOptimisticProfile(authUser));
      await upsertUser(authUser);

      // Production can briefly read before the upserted row is visible.
      // Retry a couple of times so the UI does not fall back to "guest".
      let nextProfile = await fetchProfile(authUser.id);
      if (!nextProfile) {
        await delay(250);
        nextProfile = await fetchProfile(authUser.id);
      }
      if (!nextProfile) {
        await delay(500);
        await fetchProfile(authUser.id);
      }
    } catch (err) {
      console.error("syncUserData error:", err);
    }
  };

  const completeAuthCallbackFromUrl = async () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const hashParams = new URLSearchParams(hash);
    const authCode = url.searchParams.get("code");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    try {
      if (authCode) {
        await supabase.auth.exchangeCodeForSession(authCode);
        const pending = readPendingAuthRedirect();
        const targetPath =
          pending?.autoResume === true &&
          typeof pending?.path === "string" &&
          pending.path.trim() &&
          pending.path.trim() !== "/"
            ? pending.path.trim() : "";

        url.searchParams.delete("code");
        url.searchParams.delete("type");
        window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

        if (url.pathname === "/" && targetPath) {
          console.log("[AuthContext] OAuth code callback resume ->", targetPath);
          clearPendingAuthRedirect();
          window.location.replace(new URL(targetPath, window.location.origin).toString());
          return;
        }
        return;
      }

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        const pending = readPendingAuthRedirect();
        const targetPath =
          pending?.autoResume === true &&
          typeof pending?.path === "string" &&
          pending.path.trim() &&
          pending.path.trim() !== "/"
            ? pending.path.trim() : "";

        window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);

        if (url.pathname === "/" && targetPath) {
          console.log("[AuthContext] OAuth token callback resume ->", targetPath);
          clearPendingAuthRedirect();
          window.location.replace(new URL(targetPath, window.location.origin).toString());
          return;
        }
      }
    } catch (err) {
      console.warn("Auth callback completion failed:", err);
    }
  };

  useEffect(() => {
    let alive = true;

    const restoreSession = async () => {
      try {
        await completeAuthCallbackFromUrl();
        const { data, error } = await supabase.auth.getSession();
        if (error) console.warn("getSession error:", error);
        if (!alive) return;

        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        setLoading(false);

        if (data.session?.user?.id) {
          setProfile((current) => current ?? buildOptimisticProfile(data.session.user));
          void syncUserData(data.session.user);
          // ✅ Always invalidate on session restore so data is fresh
          invalidateCatalogQueries();
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("restoreSession error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    restoreSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      window.setTimeout(() => {
        void (async () => {
          try {
            setSession(nextSession ?? null);
            setUser(nextSession?.user ?? null);

            if (nextSession?.user) {
              setProfile((current) => current ?? buildOptimisticProfile(nextSession.user));
              void syncUserData(nextSession.user);
              // ✅ Invalidate catalog on every auth state change
              invalidateCatalogQueries();
            } else {
              setProfile(null);
              // ✅ Also clear on sign-out
              clearCatalogCaches();
              clearMemoryCache();
            }
          } catch (e) {
            console.error("onAuthStateChange error:", e);
          }
        })();
      }, 0);
    });

    // ✅ Safari BFCache fix: clear and re-fetch when page is restored from cache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log("[Safari] BFCache restore - clearing catalog caches");
        clearCatalogCaches();
        clearMemoryCache();
        if (_queryClient) {
          _queryClient.removeQueries({ queryKey: ["cards"] });
          _queryClient.removeQueries({ queryKey: ["templates"] });
          _queryClient.removeQueries({ queryKey: ["categories"] });
          _queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "templates" });
        }
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const signUp = async ({ fullName, phone, email, password }: SignUpInput) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    if (data.user) {
      await upsertUser(data.user);
      await fetchProfile(data.user.id);
    }
    if (!data.session) {
      toast.success("Account created. Please check your email to confirm your account.");
    } else {
      toast.success("Account created & logged in!");
    }
    return data;
  };

  const signIn = async ({ email, password }: SignInInput) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) throw error;

    if (data.session?.access_token && data.session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    const verifiedSession = data.session ?? (await supabase.auth.getSession()).data.session ?? null;
    const verifiedUser = verifiedSession?.user ?? data.user ?? null;

    setSession(verifiedSession);
    setUser(verifiedUser);

    if (verifiedUser?.id) {
      setProfile((current) => current ?? buildOptimisticProfile(verifiedUser));
      void syncUserData(verifiedUser);
      // ✅ Ensure catalog is cleared + re-fetched after sign-in
      invalidateCatalogQueries();
    } else {
      setProfile(null);
      throw new Error("Sign-in completed but session was not restored.");
    }

    return { ...data, session: verifiedSession, user: verifiedUser };
  };

  const signInWithGoogle = async (redirectPath?: string) => {
    const isSafariIos =
      typeof window !== "undefined" && isSafariBrowser() && isIosTouchDevice();
    const safariFallbackPath =
      isSafariIos && window.location.pathname !== USER_ROUTES.SIGNIN
        ? `${window.location.pathname}${window.location.search}${window.location.hash}` || "/"
        : "/";
    const nextPath =
      typeof redirectPath === "string" && redirectPath.trim()
        ? redirectPath.trim()
        : safariFallbackPath;
    const oauthRedirectTo = buildOAuthCallbackUrl(nextPath) || redirectTo;

    const { error, data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: oauthRedirectTo,
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) throw error;
    if (!data?.url) throw new Error("Unable to start Google sign-in.");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Clear all caches on sign out (all browsers, not just Safari)
    clearCatalogCaches();
    clearMemoryCache();
    if (_queryClient) {
      _queryClient.removeQueries({ queryKey: ["cards"] });
      _queryClient.removeQueries({ queryKey: ["templates"] });
      _queryClient.removeQueries({ queryKey: ["categories"] });
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const premiumActive = useMemo(() => computePremiumActive(profile), [profile]);
  const bundleActive = useMemo(() => computeBundleActive(profile), [profile]);
  const plan = useMemo(() => computePlan(profile), [profile]);
  const premiumExpiresAt = profile?.premium_expires_at ?? null;
  const bundleExpiresAt = profile?.bundle_expires_at ?? null;

  const value: AuthContextType = useMemo(
    () => ({
      user, session, profile, loading,
      plan, premiumActive, bundleActive,
      premiumExpiresAt, bundleExpiresAt,
      signUp, signIn, signInWithGoogle, signOut,
      refreshUser, refreshProfile,
    }),
    [user, session, profile, loading, plan, premiumActive, bundleActive, premiumExpiresAt, bundleExpiresAt]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
