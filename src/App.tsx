import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { BottomTabBar } from "@/components/BottomTabBar";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import ClosetPage from "@/pages/ClosetPage";
import AddClothingPage from "@/pages/AddClothingPage";
import ItemDetailPage from "@/pages/ItemDetailPage";
import StylePage from "@/pages/StylePage";
import OutfitsPage from "@/pages/OutfitsPage";
import OutfitDetailPage from "@/pages/OutfitDetailPage";
import OnboardingPage from "@/pages/OnboardingPage";
import ProfilePage from "@/pages/ProfilePage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

function AuthGuard() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink bg-card text-[12px] font-bold animate-pulse">
          ✦
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: pathname }} />;
  }

  const hideTabBar = pathname === "/onboarding";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      {!hideTabBar && <BottomTabBar />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-sm text-center">
        <p className="display text-7xl text-foreground">404</p>
        <h2 className="mt-3 text-lg text-foreground">This page slipped out of the closet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find what you were looking for.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          Back home
        </a>
      </div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route element={<AuthGuard />}>
              <Route path="/closet" element={<ClosetPage />} />
              <Route path="/closet/add" element={<AddClothingPage />} />
              <Route path="/closet/:itemId" element={<ItemDetailPage />} />
              <Route path="/style" element={<StylePage />} />
              <Route path="/outfits" element={<OutfitsPage />} />
              <Route path="/outfits/:outfitId" element={<OutfitDetailPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-center" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
