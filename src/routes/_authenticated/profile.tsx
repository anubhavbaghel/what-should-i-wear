import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { getProfile, updateMannequinPreset, updateStylePresentation } from "@/lib/outfits.functions";
import { BodyTypeSelector } from "@/components/BodyTypeSelector";
import { AvatarDesignerStudio } from "@/components/AvatarDesignerStudio";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — What to Wear Today?" },
      { name: "description", content: "Your wardrobe profile." },
    ],
  }),
  component: ProfilePage,
});

const PRESENTATIONS = [
  { id: "neutral", label: "✦ Unisex / Neutral" },
  { id: "masculine", label: "👔 Menswear" },
  { id: "feminine", label: "👗 Womenswear" },
] as const;

type Presentation = (typeof PRESENTATIONS)[number]["id"];

const PRESETS = [
  { id: "slim_light", label: "Slim · Light" },
  { id: "slim_medium", label: "Slim · Medium" },
  { id: "slim_dark", label: "Slim · Deep" },
  { id: "neutral_light", label: "Athletic · Light" },
  { id: "neutral_medium", label: "Athletic · Medium" },
  { id: "neutral_dark", label: "Athletic · Deep" },
  { id: "curvy_light", label: "Broad/Curvy · Light" },
  { id: "curvy_medium", label: "Broad/Curvy · Medium" },
  { id: "curvy_dark", label: "Broad/Curvy · Deep" },
] as const;

type Preset = (typeof PRESETS)[number]["id"];

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const setPresetFn = useServerFn(updateMannequinPreset);
  const setPresentationFn = useServerFn(updateStylePresentation);

  const [user, setUser] = useState<{ email: string | null; name: string | null; avatar: string | null } | null>(null);
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setUser({
        email: u.email ?? null,
        name:
          (u.user_metadata?.full_name as string | undefined) ??
          (u.user_metadata?.name as string | undefined) ??
          null,
        avatar: (u.user_metadata?.avatar_url as string | undefined) ?? null,
      });
    });
  }, []);

  const currentPreset = (profileData?.profile?.mannequin_preset as Preset | undefined) ?? "neutral_medium";
  const currentPresentation = (profileData?.stylePresentation as Presentation | undefined) ?? "neutral";
  const [profileView, setProfileView] = useState<"3d" | "cards">("3d");

  async function pickPreset(
    p: Preset,
    avatarConfig?: {
      build?: "slim" | "neutral" | "curvy";
      skinToneHex?: string;
      presentation?: "neutral" | "masculine" | "feminine";
      baseWearHex?: string;
      heightScale?: number;
    }
  ) {
    try {
      await setPresetFn({ data: { preset: p, avatarConfig } });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Figure updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save.");
    }
  }

  async function pickPresentation(pr: Presentation) {
    try {
      await setPresentationFn({ data: { presentation: pr } });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Style preference updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="px-5 pt-10 pb-32">
      <header>
        <span className="sticker -rotate-2">account</span>
        <h1 className="display mt-3 text-[2.4rem] text-foreground">
          Your{" "}
          <span className="inline-block -rotate-1 rounded-xl border-[1.5px] border-ink px-2" style={{ background: "var(--pink)" }}>
            profile
          </span>
        </h1>
      </header>

      <section
        className="card-pop mt-8 flex items-center gap-4 p-5"
        style={{ background: "var(--mint-soft)" }}
      >
        <div className="h-14 w-14 overflow-hidden rounded-full border-[1.5px] border-ink bg-card">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold">
              {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "✦"}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{user?.name ?? "Stylish you"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email ?? ""}</p>
        </div>
      </section>

      {/* Visual Mannequin Figure Customizer */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="display text-lg text-foreground">Your Mannequin Figure</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Customize your styling vibe, skin tone, and body silhouette.
            </p>
          </div>
          <div className="flex rounded-full border-[1.5px] border-ink bg-card p-0.5 text-[11px] font-bold shrink-0">
            <button
              type="button"
              onClick={() => setProfileView("3d")}
              className={cn(
                "px-2.5 py-0.5 rounded-full transition-colors",
                profileView === "3d" ? "bg-sun text-ink shadow-[1px_1px_0px_#1B1B1D]" : "text-muted-foreground hover:text-ink"
              )}
            >
              3D Studio
            </button>
            <button
              type="button"
              onClick={() => setProfileView("cards")}
              className={cn(
                "px-2.5 py-0.5 rounded-full transition-colors",
                profileView === "cards" ? "bg-sun text-ink shadow-[1px_1px_0px_#1B1B1D]" : "text-muted-foreground hover:text-ink"
              )}
            >
              Cards
            </button>
          </div>
        </div>

        <div className="mt-5">
          {profileView === "3d" ? (
            <AvatarDesignerStudio
              initialPreset={currentPreset}
              initialPresentation={currentPresentation}
              showSaveButton={true}
              onSave={async (cfg) => {
                await pickPreset(cfg.preset as Preset, cfg);
                await pickPresentation(cfg.presentation as Presentation);
                toast.success("3D Mannequin saved ✦");
              }}
            />
          ) : (
            <BodyTypeSelector
              value={currentPreset}
              onChange={(p) => pickPreset(p as Preset)}
              presentation={currentPresentation}
              onPresentationChange={(pr) => pickPresentation(pr as Presentation)}
              showPresentationToggle={true}
            />
          )}
        </div>
      </section>

      <button onClick={signOut} className="btn-pop mt-10 w-full py-4 text-sm" data-tone="paper">
        <LogOut className="h-4 w-4" /> Sign out
      </button>

      <p className="mt-10 text-center text-xs text-muted-foreground">✦ what to wear today?</p>
    </div>
  );
}
