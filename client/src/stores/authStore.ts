import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase';

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

interface AuthState {
  user: User | null;
  loading: boolean;
  signUp: (input: SignUpInput) => Promise<any>;
  signIn: (input: SignInInput) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

// Helper function to upsert user into database
const upsertUser = async (authUser: User) => {
  try {
    const { data: existing } = await supabase
      .from("Users")
      .select("id")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("Users").insert([
        {
          auth_id: authUser.id,
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            "",
          email: authUser.email,
          phone: authUser.user_metadata?.phone || null,
          password: null, // optional — don't store plain passwords!
        },
      ]);
    }
  } catch (err) {
    console.error("Error upserting user:", err);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,

      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),

      // Email + Password Signup
      signUp: async ({ fullName, phone, email, password }: SignUpInput) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone },
          },
        });

        if (error) throw error;

        const authUser = data.user;
        if (authUser) {
          await upsertUser(authUser);
          set({ user: authUser });
        }

        return data;
      },

      // Email + Password Signin
      signIn: async ({ email, password }: SignInInput) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const authUser = data.user;
        if (authUser) {
          await upsertUser(authUser);
          set({ user: authUser });
        }

        return data;
      },

      // Google Signin
      signInWithGoogle: async () => {
        const redirectTo =
          window.location.hostname === "localhost"
            ? "http://localhost:5173/"
            : "https://diypersonalisation.com/";
            
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              prompt: "select_account",
            },
          },
        });
        if (error) throw error;
        return data;
      },

      // Signout
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Initialize auth state on app start
export const initializeAuth = async () => {
  const { setUser, setLoading } = useAuthStore.getState();
  
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    setUser(session?.user ?? null);
    setLoading(false);

    // Watch for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // After Google login or normal signup, ensure record exists in DB
      if (currentUser) {
        await upsertUser(currentUser);
      }
    });

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error initializing auth:', error);
    setLoading(false);
  }
};
