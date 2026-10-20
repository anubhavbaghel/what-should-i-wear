import React from "react";
import { MannequinAvatar, BuildType, SkinToneType, StylePresentationType } from "./MannequinAvatar";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface BodyTypeSelectorProps {
  value: string; // e.g. "neutral_medium", "slim_light", "curvy_dark"
  onChange: (preset: string) => void;
  presentation?: StylePresentationType;
  onPresentationChange?: (presentation: StylePresentationType) => void;
  showPresentationToggle?: boolean;
}

const BUILDS: { id: BuildType; label: string; desc: string }[] = [
  { id: "slim", label: "Slim", desc: "Lean, straight posture" },
  { id: "neutral", label: "Athletic", desc: "Balanced, athletic build" },
  { id: "curvy", label: "Broad / Curvy", desc: "Fuller silhouette / broad" },
];

const SKIN_TONES: { id: SkinToneType; label: string; color: string }[] = [
  { id: "light", label: "Light", color: "#FCE5D8" },
  { id: "medium", label: "Medium", color: "#D59D7B" },
  { id: "dark", label: "Deep", color: "#6D4835" },
];

const PRESENTATIONS: { id: StylePresentationType; label: string }[] = [
  { id: "neutral", label: "✦ Unisex / Neutral" },
  { id: "masculine", label: "👔 Menswear" },
  { id: "feminine", label: "👗 Womenswear" },
];

export function BodyTypeSelector({
  value,
  onChange,
  presentation = "neutral",
  onPresentationChange,
  showPresentationToggle = true,
}: BodyTypeSelectorProps) {
  // Parse preset into [build, skinTone]
  const [currentBuild, currentSkin] = (value.split("_") as [BuildType, SkinToneType]) || [
    "neutral",
    "medium",
  ];

  const build = BUILDS.some((b) => b.id === currentBuild) ? currentBuild : "neutral";
  const skin = SKIN_TONES.some((s) => s.id === currentSkin) ? currentSkin : "medium";

  function setBuild(newBuild: BuildType) {
    onChange(`${newBuild}_${skin}`);
  }

  function setSkin(newSkin: SkinToneType) {
    onChange(`${build}_${newSkin}`);
  }

  return (
    <div className="space-y-6">
      {/* Optional Presentation / Style Vibe */}
      {showPresentationToggle && onPresentationChange && (
        <div>
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Style vibe
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESENTATIONS.map((pr) => (
              <button
                key={pr.id}
                type="button"
                onClick={() => onPresentationChange(pr.id)}
                className="chip text-[13px]"
                data-active={presentation === pr.id}
              >
                {pr.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Skin Tone Palette Swatches */}
      <div>
        <span className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Skin Tone
        </span>
        <div className="flex items-center gap-3">
          {SKIN_TONES.map((st) => {
            const active = skin === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSkin(st.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-card px-3.5 py-1.5 transition-all active:scale-95",
                  active
                    ? "border-ink bg-card shadow-[2px_2px_0px_#1B1B1D]"
                    : "border-ink/40 opacity-75 hover:opacity-100 hover:border-ink",
                )}
              >
                <span
                  className="h-4 w-4 rounded-full border border-ink/40 shadow-inner flex items-center justify-center text-white"
                  style={{ background: st.color }}
                >
                  {active && <Check className="h-2.5 w-2.5 stroke-[3] text-ink" />}
                </span>
                <span className="text-xs font-semibold text-foreground">{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Avatar Cards */}
      <div>
        <span className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Body Build (Select Your Mannequin)
        </span>
        <div className="grid grid-cols-3 gap-3">
          {BUILDS.map((b) => {
            const active = build === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBuild(b.id)}
                className={cn(
                  "card-pop group flex flex-col items-center justify-between p-3 text-center transition-all cursor-pointer",
                  active
                    ? "translate-x-[2px] translate-y-[2px] border-ink bg-card shadow-none ring-2 ring-pink"
                    : "hover:bg-muted/30 opacity-90 hover:opacity-100",
                )}
                style={{
                  background: active ? "var(--pink-soft)" : "var(--card)",
                }}
              >
                {/* Visual Avatar Figure */}
                <div className="py-2 h-36 flex items-center justify-center">
                  <MannequinAvatar
                    build={b.id}
                    skinTone={skin}
                    presentation={presentation}
                    size="md"
                    className="transition-transform group-hover:scale-105"
                  />
                </div>

                {/* Info & Label */}
                <div className="w-full pt-2 border-t-[1.5px] border-ink/15">
                  <p className="text-[13px] font-bold text-foreground">{b.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                    {b.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
