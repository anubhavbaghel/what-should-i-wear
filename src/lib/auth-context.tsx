import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/services/supabase/client";
import { profileRepository } from "@/services/supabase/profile.repository";
import type { UserProfile, MannequinPreset } from "@/domain/user";

const DEMO_USER: User = {
  id: "demo-user-id",
  app_metadata: {},
  user_metadata: { full_name: "Demo User", name: "Demo User", avatar_url: null },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

const DEMO_SESSION: Session = {
  access_token: "demo-token",
  refresh_token: "demo-refresh",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: "bearer",
  user: DEMO_USER,
} as Session;

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isDemo: boolean;
  profile: UserProfile | null;
  signInDemo: () => void;
  signOutDemo: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  isDemo: false,
  profile: null,
  signInDemo: () => {},
  signOutDemo: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    isDemo: false,
    profile: null,
    signInDemo: () => {},
    signOutDemo: () => {},
    refreshProfile: async () => {},
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const profile = await profileRepository.getProfile(userId);
      setState((s) => ({ ...s, profile }));
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    }
  }, []);

  const signInDemo = useCallback(() => {
    setState((s) => ({
      ...s,
      session: DEMO_SESSION,
      user: DEMO_USER,
      isDemo: true,
      loading: false,
    }));
  }, []);

  const signOutDemo = useCallback(() => {
    setState((s) => ({
      ...s,
      session: null,
      user: null,
      isDemo: false,
      profile: null,
      loading: false,
    }));
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = state.user?.id;
    if (userId) await fetchProfile(userId);
  }, [state.user?.id, fetchProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState((s) => ({
        ...s,
        loading: false,
        signInDemo,
        signOutDemo,
        refreshProfile,
      }));
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setState((s) => ({
        ...s,
        session,
        user,
        loading: false,
        signInDemo,
        signOutDemo,
        refreshProfile,
      }));
      if (user) fetchProfile(user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setState((s) => ({
        ...s,
        session,
        user,
        loading: false,
      }));
      if (user) fetchProfile(user.id);
    });

    return () => subscription.unsubscribe();
  }, [signInDemo, signOutDemo, fetchProfile, refreshProfile]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
