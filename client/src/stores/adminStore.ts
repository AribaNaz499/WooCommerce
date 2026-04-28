import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabase/supabase';

const ADMIN_ALLOWED_ROLES = new Set(["admin", "superadmin"]);
const normalizeRole = (role?: string | null) =>
  String(role ?? "").trim().toLowerCase();
const isAllowedRole = (role?: string | null) =>
  ADMIN_ALLOWED_ROLES.has(normalizeRole(role));

type Admin = {
  id: string;
  role: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  profile_image?: string;
};

interface AdminState {
  isAdmin: boolean;
  admin: Admin | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setAdmin: (admin: Admin | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, _) => ({
      isAdmin: false,
      admin: null,

      setAdmin: (admin) => set({ admin }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),

      // Login function (Supabase Auth)
      login: async (email: string, password: string): Promise<boolean> => {
        try {
          const cleanEmail = email.trim().toLowerCase();
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (error || !data.user) {
            console.error("Invalid credentials:", error);
            return false;
          }

          const role = (data.user.app_metadata as any)?.role ?? (data.user.user_metadata as any)?.role;
          if (!isAllowedRole(role)) {
            console.error("Access denied: role not allowed");
            await supabase.auth.signOut();
            return false;
          }

          const admin: Admin = {
            id: data.user.id,
            role: String(role),
            first_name: (data.user.user_metadata as any)?.first_name ?? "Admin",
            last_name: (data.user.user_metadata as any)?.last_name ?? "User",
            email: data.user.email ?? cleanEmail,
            profile_image:
              (data.user.user_metadata as any)?.avatar_url ??
              (data.user.user_metadata as any)?.picture ??
              undefined,
          };

          set({ isAdmin: true, admin });
          return true;
        } catch (err) {
          console.error("Login error:", err);
          return false;
        }
      },

      // Logout function
      logout: () => {
        set({ isAdmin: false, admin: null });
      },
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({ 
        isAdmin: state.isAdmin, 
        admin: state.admin 
      }),
    }
  )
);
