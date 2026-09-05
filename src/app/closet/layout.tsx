"use client";

import { AuthGuard } from "@/components/auth-guard";

export default function ClosetLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
