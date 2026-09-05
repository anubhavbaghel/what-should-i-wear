import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/services/supabase/client";

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
  signInDemo: () => void;
  signOutDemo: () => void;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  isDemo: false,
  signInDemo: () => {},
  signOutDemo: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    isDemo: false,
    signInDemo: () => {},
    signOutDemo: () => {},
  });

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
      loading: false,
    }));
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState((s) => ({
        ...s,
        loading: false,
        signInDemo,
        signOutDemo,
      }));
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({
        ...s,
        session,
        user: session?.user ?? null,
        loading: false,
        signInDemo,
        signOutDemo,
      }));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, [signInDemo, signOutDemo]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
