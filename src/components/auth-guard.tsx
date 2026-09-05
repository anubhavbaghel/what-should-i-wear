"use client";

import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomTabBar } from "@/components/BottomTabBar";

const ONBOARDING_BYPASS = ["/onboarding"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (profile && !profile.onboarded_at && !ONBOARDING_BYPASS.includes(pathname)) {
      router.replace("/onboarding");
    }
  }, [loading, user, profile, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink bg-card text-[12px] font-bold animate-pulse">
          ✦
        </span>
      </div>
    );
  }

  if (!user) return null;

  const hideTabBar = pathname === "/onboarding";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">{children}</div>
      {!hideTabBar && <BottomTabBar />}
    </div>
  );
}
