import { useEffect } from "react";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getProfile, resetDemoSession } from "@/lib/outfits.functions";
import { BottomTabBar } from "@/components/BottomTabBar";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;

    // Allow demo mode without requiring Supabase OAuth
    const isDemo = localStorage.getItem("whattowear_demo_mode") === "true";
    if (isDemo) return;

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href } as never,
      });
    }
  },
  component: AuthenticatedLayout,
});

// Paths that should NOT trigger the onboarding redirect (user is mid-flow there).
const ONBOARDING_BYPASS = ["/onboarding"];

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchProfile = useServerFn(getProfile);
  const resetDemo = useServerFn(resetDemoSession);

  const isDemo =
    typeof window !== "undefined" &&
    localStorage.getItem("whattowear_demo_mode") === "true";

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
    staleTime: 60_000,
  });

  useEffect(() => {
    const profile = data?.profile;
    if (!profile) return;
    if (!profile.onboarded_at && !ONBOARDING_BYPASS.includes(pathname)) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [data, pathname, navigate]);

  const hideTabBar = pathname === "/onboarding";

  async function restartOnboarding() {
    await resetDemo();
    await qc.invalidateQueries();
    navigate({ to: "/onboarding", replace: true });
  }

  function exitDemo() {
    localStorage.removeItem("whattowear_demo_mode");
    document.cookie = "whattowear_demo_mode=; path=/; max-age=0";
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {isDemo && (
        <div className="sticky top-0 z-50 flex items-center justify-between border-b-[1.5px] border-ink bg-sun px-4 py-1.5 text-xs font-bold text-ink shadow-sm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-pink animate-pulse" />
            ⚡ Demo Mode
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={restartOnboarding}
              className="rounded-full border-[1.5px] border-ink bg-card px-2.5 py-0.5 text-[11px] font-bold text-ink hover:bg-muted active:scale-95"
            >
              Restart Onboarding
            </button>
            <button
              onClick={exitDemo}
              className="rounded-full border-[1.5px] border-ink bg-card px-2.5 py-0.5 text-[11px] font-bold text-ink hover:bg-muted active:scale-95"
            >
              Exit Demo
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      {!hideTabBar && <BottomTabBar />}
    </div>
  );
}
