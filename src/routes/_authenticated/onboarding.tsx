import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ChevronRight, Loader2, Sparkles, Camera, Shirt, RotateCcw, LogOut } from "lucide-react";
import { completeOnboarding, getProfile } from "@/lib/outfits.functions";
import { AvatarDesignerStudio } from "@/components/AvatarDesignerStudio";
import { StylePresentationType } from "@/components/ThreeMannequinViewer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome — WhatShouldIWear" },
      { name: "description", content: "Design your mannequin & setup your closet in 30 seconds." },
    ],
  }),
  component: OnboardingPage,
});

export default function OnboardingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const finish = useServerFn(completeOnboarding);

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const [step, setStep] = useState(1); // Default to Step 1: Design your mannequin
  const [name, setName] = useState("");
  const [preset, setPreset] = useState("neutral_medium");
  const [presentation, setPresentation] = useState<StylePresentationType>("feminine");
  const [saving, setSaving] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState<{
    build?: "slim" | "neutral" | "curvy";
    skinToneHex?: string;
    presentation?: StylePresentationType;
    baseWearHex?: string;
    heightScale?: number;
  } | undefined>(undefined);

  useEffect(() => {
    const p = profileData?.profile;
    if (!p) return;
    if (p.onboarded_at) {
      navigate({ to: "/closet", replace: true });
      return;
    }
    if (p.display_name && !name) setName(p.display_name);
    if (p.mannequin_preset) setPreset(p.mannequin_preset);
    if (profileData?.stylePresentation) {
      setPresentation(profileData.stylePresentation as StylePresentationType);
    }
    if (profileData?.avatarConfig) {
      setAvatarConfig(profileData.avatarConfig);
    }
  }, [profileData, navigate, name]);

  async function save(goAdd: boolean) {
    setSaving(true);
    try {
      await finish({
        data: {
          displayName: name.trim() || undefined,
          preset,
          stylePresentation: presentation,
          avatarConfig,
        },
      });
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("You're all set ✦");
      navigate({ to: goAdd ? "/closet/add" : "/closet", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
      setSaving(false);
    }
  }

  function handleExit() {
    localStorage.removeItem("whattowear_demo_mode");
    document.cookie = "whattowear_demo_mode=; path=/; max-age=0";
    window.location.href = "/login";
  }

  // STEP 1: Full-Screen Dedicated Mannequin Studio (Desktop + Mobile, Zero Scroll)
  if (step === 1) {
    return (
      <div className="h-dvh w-screen overflow-hidden bg-[#FAF0E6]">
        <AvatarDesignerStudio
          initialPreset={preset}
          initialPresentation={presentation}
          currentStep={1}
          onContinue={() => setStep(2)}
          onBack={() => setStep(0)}
          onRestart={() => setStep(0)}
          onExit={handleExit}
          onChange={(cfg) => {
            setPreset(cfg.preset);
            setPresentation(cfg.presentation);
            setAvatarConfig(cfg);
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-dvh w-screen overflow-hidden bg-[#FAF0E6] flex flex-col justify-center items-center p-4 select-none">
      <div className="w-full max-w-lg rounded-[32px] border-2 border-ink bg-[#FFFDF9] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col">
        {/* Yellow Header Bar */}
        <div className="h-14 shrink-0 bg-[#FFE169] border-b-2 border-ink px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-full bg-[#FF8096] border border-ink shadow-2xs" />
            <span className="text-base font-black tracking-tight text-ink flex items-center gap-1">
              <span>⚡</span> WhatShouldIWear
            </span>
          </div>

          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-2.5 w-8 rounded-full border border-ink transition-colors",
                  i <= step ? "bg-[#FF8096]" : "bg-white"
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleExit}
            className="flex items-center gap-1 rounded-full border border-ink bg-white px-3 py-1 text-xs font-bold text-ink shadow-2xs hover:bg-neutral-100"
          >
            <LogOut className="h-3 w-3 stroke-[2.5]" />
            <span>Exit</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.section
                key="welcome"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className="rounded-full border border-ink bg-[#B6F3D6] px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-ink shadow-2xs">
                  Welcome ✦
                </span>
                <h1 className="mt-3 text-3xl md:text-4xl font-black leading-tight text-ink">
                  Hey —{" "}
                  <span className="inline-block rounded-xl border border-ink bg-[#FFE169] px-2.5 py-0.5 shadow-2xs">
                    what should
                  </span>{" "}
                  we call you?
                </h1>
                <p className="mt-2 text-xs md:text-sm text-muted-foreground font-semibold">
                  We'll personalize your closet experience.
                </p>

                <label className="mt-6 block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-ink">
                    Your name
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full rounded-2xl border-2 border-ink bg-white px-4 py-3 text-sm font-bold text-ink shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#FF8096]"
                  />
                </label>

                <button
                  onClick={() => setStep(1)}
                  className="mt-8 w-full rounded-full border-2 border-ink bg-[#FF8096] hover:bg-[#ff6c83] py-3.5 text-base font-black text-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 active:scale-98 transition-transform"
                  type="button"
                >
                  <span>Design My Mannequin</span>
                  <ChevronRight className="h-5 w-5 stroke-[2.5]" />
                </button>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="how"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <span className="rounded-full border border-ink bg-[#FFE169] px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-ink shadow-2xs">
                  Ready to Style ✦
                </span>
                <h1 className="mt-3 text-3xl md:text-4xl font-black leading-tight text-ink">
                  Three steps to a{" "}
                  <span className="inline-block rounded-xl border border-ink bg-[#FF8096] px-2.5 py-0.5 shadow-2xs">
                    smart closet
                  </span>
                  .
                </h1>

                <ol className="mt-5 space-y-2.5">
                  <StepItem
                    n={1}
                    icon={<Camera className="h-4 w-4" />}
                    tone="pink"
                    title="Scan your pieces"
                    body="Snap a photo — we auto-tag and fit to your twin."
                  />
                  <StepItem
                    n={2}
                    icon={<Sparkles className="h-4 w-4" />}
                    tone="sun"
                    title="Style a look"
                    body="Mix pieces; 3D twin models each outfit."
                  />
                  <StepItem
                    n={3}
                    icon={<Shirt className="h-4 w-4" />}
                    tone="mint"
                    title="Save outfits"
                    body="Keep favorite fits ready for any day."
                  />
                </ol>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={() => save(true)}
                    disabled={saving}
                    className="w-full rounded-full border-2 border-ink bg-[#FF8096] hover:bg-[#ff6c83] py-3.5 text-sm font-black text-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2 active:scale-98 transition-transform disabled:opacity-60"
                    type="button"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Setting up…
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 stroke-[2.5]" /> Scan my first piece
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => save(false)}
                    disabled={saving}
                    className="w-full rounded-full border border-ink bg-white py-2.5 text-xs font-bold text-ink hover:bg-neutral-50 active:scale-98 transition-transform"
                    type="button"
                  >
                    I'll explore my closet first
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StepItem({
  n,
  icon,
  title,
  body,
  tone,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "pink" | "mint" | "sun";
}) {
  const bg = tone === "pink" ? "#FFF0F3" : tone === "mint" ? "#EBFBF2" : "#FFFBEA";
  const badge = tone === "pink" ? "#FF8096" : tone === "mint" ? "#7BE495" : "#FFE169";

  return (
    <li
      className="flex items-start gap-3 rounded-2xl border-2 border-ink p-3 shadow-2xs"
      style={{ backgroundColor: bg }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink text-xs font-black shadow-2xs"
        style={{ backgroundColor: badge }}
      >
        {n}
      </span>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-black text-ink">
          {icon} {title}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground font-semibold">{body}</p>
      </div>
    </li>
  );
}
