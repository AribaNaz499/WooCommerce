// context/AdminContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, supabaseAdmin } from "../supabase/supabase";
import type { User } from "@supabase/supabase-js";
import toast from "react-hot-toast";

export type Admin = {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string; // NOTE: storing plain passwords is unsafe in real apps
  profile_image?: string | null;
};

type AdminContextType = {
  isAdmin: boolean;
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateAdmin: (patch: Partial<Omit<Admin, "id">>) => Promise<Admin | null>;
  refreshFromDb: (id: string) => Promise<Admin | null>;
};

const AdminContext = createContext<AdminContextType | null>(null);

const ADMIN_STORAGE_KEY = "adminData";
const ADMIN_ALLOWED_ROLES = new Set(["admin", "superadmin"]);

const normalizeRole = (role?: string | null) =>
  String(role ?? "").trim().toLowerCase();

const isAllowedRole = (role?: string | null) =>
  ADMIN_ALLOWED_ROLES.has(normalizeRole(role));

const getAuthRole = (user: User | null) => {
  const meta: any = user?.app_metadata ?? {};
  const userMeta: any = user?.user_metadata ?? {};
  return meta?.role ?? userMeta?.role ?? null;
};

function readLocalAdmin(): Admin | null {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Admin) : null;
  } catch {
    return null;
  }
}

function writeLocalAdmin(admin: Admin | null) {
  if (!admin) {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    return;
  }
  const { password: _password, ...safe } = admin;
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(safe));
}

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const getNameParts = (user?: User | null) => {
  const meta: any = user?.user_metadata ?? {};
  const full = String(meta?.full_name ?? meta?.name ?? "").trim();
  if (!full) return { first_name: "Admin", last_name: "User" };
  const [first, ...rest] = full.split(" ");
  return { first_name: first || "Admin", last_name: rest.join(" ").trim() || "User" };
};

const fetchAdminByEmail = async (email: string) => {
  const { data, error } = await supabaseAdmin
    .from("admins")
    .select("id, role, first_name, last_name, email, profile_image")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return (data as Admin | null) ?? null;
};

const ensureAdminProfile = async (user: User, role: string): Promise<Admin> => {
  const email = user.email ?? "";
  const existing = await fetchAdminByEmail(email);
  if (existing) return existing;

  const name = getNameParts(user);
  const profile_image =
    (user.user_metadata as any)?.avatar_url ??
    (user.user_metadata as any)?.picture ??
    null;

  const payload = {
    role,
    first_name: name.first_name,
    last_name: name.last_name,
    email,
    profile_image,
  };

  const { data, error } = await supabaseAdmin
    .from("admins")
    .insert([payload])
    .select("id, role, first_name, last_name, email, profile_image")
    .single();

  if (!error && data) return data as Admin;

  return {
    id: user.id,
    role,
    first_name: name.first_name,
    last_name: name.last_name,
    email,
    profile_image,
  };
};

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  // initialize from localStorage synchronously to avoid flicker
  const initialAdmin = useMemo(() => (typeof window !== "undefined" ? readLocalAdmin() : null), []);
  const [admin, setAdmin] = useState<Admin | null>(initialAdmin);
  const [isAdmin, setIsAdmin] = useState<boolean>(isAllowedRole(initialAdmin?.role));
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session?.user) return;
        const role = getAuthRole(data.session.user);
        if (!isAllowedRole(role)) return;
        const profile = await ensureAdminProfile(data.session.user, normalizeRole(role));
        if (!mounted) return;
        setAdmin(profile);
        setIsAdmin(true);
        writeLocalAdmin(profile);
      } catch (e) {
        console.error("restore admin session error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    restore();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!session?.user) {
          setAdmin(null);
          setIsAdmin(false);
          writeLocalAdmin(null);
          return;
        }
        const role = getAuthRole(session.user);
        if (!isAllowedRole(role)) {
          setAdmin(null);
          setIsAdmin(false);
          writeLocalAdmin(null);
          return;
        }
        const profile = await ensureAdminProfile(session.user, normalizeRole(role));
        setAdmin(profile);
        setIsAdmin(true);
        writeLocalAdmin(profile);
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Optional: sanity-refresh admin row on mount if you want
  useEffect(() => {
  let mounted = true;

  const refresh = async () => {
    if (!initialAdmin?.id) return;

    // ✅ skip DB call for local/non-uuid ids
    if (!isUuid(initialAdmin.id)) return;

    const { data, error } = await supabaseAdmin
      .from("admins")
      .select("id, role, first_name, last_name, email, profile_image")
      .eq("id", initialAdmin.id)
      .single();

    if (!error && mounted && data) {
      const next = data as Admin;
      setAdmin(next);
      setIsAdmin(isAllowedRole(next.role));
      writeLocalAdmin(next);
    }
  };

  refresh();
  return () => { mounted = false; };
}, [initialAdmin?.id]);


  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error || !data.user) return false;

      const role = getAuthRole(data.user);
      if (!isAllowedRole(role)) {
        await supabase.auth.signOut();
        toast.error("Access denied for this account.");
        return false;
      }

      const next = await ensureAdminProfile(data.user, normalizeRole(role));
      setAdmin(next);
      setIsAdmin(true);
      writeLocalAdmin(next);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      return false;
    }
  };

  const logout = () => {
    setIsAdmin(false);
    setAdmin(null);
    writeLocalAdmin(null);
    // DO NOT call supabase.auth.signOut() if you don't sign in via supabase.auth
    void supabase.auth.signOut();
    toast.success("Admin logged out");
  };

  const refreshFromDb = async (id: string): Promise<Admin | null> => {
    const { data, error } = await supabaseAdmin
      .from("admins")
      .select("id, role, first_name, last_name, email, profile_image")
      .eq(isUuid(id) ? "id" : "email", id)
      .maybeSingle();
    if (error || !data) return null;
    const next = data as Admin;
    setAdmin(next);
    setIsAdmin(isAllowedRole(next.role));
    writeLocalAdmin(next);
    return next;
  };

  const updateAdmin = async (patch: Partial<Omit<Admin, "id">>): Promise<Admin | null> => {
    if (!admin?.id) return null;
    const payload: Record<string, unknown> = {};
    let nextPassword: string | null = null;
    Object.entries(patch).forEach(([k, v]) => {
      if (typeof v !== "undefined") payload[k] = v;
    });

    if (typeof payload.password === "string" && payload.password.length > 0) {
      nextPassword = payload.password;
      delete payload.password;
    }

    if (nextPassword) {
      const { error } = await supabase.auth.updateUser({ password: nextPassword });
      if (error) {
        toast.error(error.message || "Failed to update password");
        return null;
      }
    }

    if (Object.keys(payload).length === 0) {
      return admin;
    }

    const updateReq = isUuid(admin.id)
      ? supabaseAdmin.from("admins").update(payload).eq("id", admin.id)
      : supabaseAdmin.from("admins").update(payload).eq("email", admin.email);

    const { data, error } = await updateReq
      .select("id, role, first_name, last_name, email, profile_image")
      .maybeSingle();

    if (error || !data) {
      console.log("Update failed:", error?.message);
      return null;
    }

    const next = data as Admin;
    setAdmin(next);
    setIsAdmin(isAllowedRole(next.role));
    writeLocalAdmin(next);
    return next;
  };

  return (
    <AdminContext.Provider value={{ isAdmin, admin, loading, login, logout, updateAdmin, refreshFromDb }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
};
