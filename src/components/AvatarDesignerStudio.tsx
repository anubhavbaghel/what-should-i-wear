import React, { useState, useEffect } from "react";
import {
  ThreeMannequinViewer,
  BuildType,
  StylePresentationType,
  MannequinOutfitConfig,
  TopGarmentType,
  BottomGarmentType,
  ShoesGarmentType,
} from "./ThreeMannequinViewer";
import { cn } from "@/lib/utils";
import { Sparkles, Check, Shirt } from "lucide-react";

export interface AvatarDesignerStudioProps {
  initialPreset?: string; // e.g. "neutral_medium", "slim_light", "curvy_dark"
  initialPresentation?: StylePresentationType;
  initialOutfit?: MannequinOutfitConfig;
  onChange?: (config: {
    preset: string;
    presentation: StylePresentationType;
    skinToneHex: string;
    baseWearHex: string;
    heightScale: number;
    outfit?: MannequinOutfitConfig;
  }) => void;
  onSave?: (config: {
    preset: string;
    presentation: StylePresentationType;
    skinToneHex: string;
    baseWearHex: string;
    heightScale: number;
    outfit?: MannequinOutfitConfig;
  }) => void;
  className?: string;
  showSaveButton?: boolean;
}

export const CURATED_OUTFIT_PRESETS: {
  id: string;
  name: string;
  vibe: string;
  outfit: MannequinOutfitConfig;
}[] = [
  {
    id: "minimalist_casual",
    name: "Black Tee & Sage Chinos",
    vibe: "Casual Minimalist",
    outfit: {
      topType: "tee",
      topColor: "#2A2A2D",
      bottomType: "wide_chinos",
      bottomColor: "#4B5344",
      shoesType: "sneakers",
      shoesColor: "#FFFFFF",
    },
  },
  {
    id: "atelier_linen",
    name: "Linen Shirt & Indigo Denim",
    vibe: "Atelier Classic",
    outfit: {
      topType: "shirt",
      topColor: "#F4F0E8",
      bottomType: "trousers",
      bottomColor: "#203046",
      shoesType: "loafers",
      shoesColor: "#1B1816",
    },
  },
  {
    id: "structured_tailored",
    name: "Camel Trench & Slate Trousers",
    vibe: "Tailored Runway",
    outfit: {
      topType: "jacket",
      topColor: "#B58C63",
      bottomType: "trousers",
      bottomColor: "#1E1E22",
      shoesType: "loafers",
      shoesColor: "#2A1E17",
    },
  },
  {
    id: "summer_studio",
    name: "White Tee & Tailored Shorts",
    vibe: "Summer Studio",
    outfit: {
      topType: "tee",
      topColor: "#FAFAFC",
      bottomType: "shorts",
      bottomColor: "#585D4F",
      shoesType: "sneakers",
      shoesColor: "#F0F0F2",
    },
  },
  {
    id: "bare_mannequin",
    name: "Bodysuit Base Layer",
    vibe: "Unadorned Mannequin",
    outfit: {
      topType: "none",
      bottomType: "none",
      shoesType: "none",
    },
  },
];

const BUILDS: { id: BuildType; label: string; desc: string }[] = [
  { id: "slim", label: "Slim", desc: "Lean, sleek croquis silhouette" },
  { id: "neutral", label: "Athletic", desc: "V-taper & balanced posture" },
  { id: "curvy", label: "Broad / Curvy", desc: "Fuller curves & broad frame" },
];

const PRESENTATIONS: { id: StylePresentationType; label: string }[] = [
  { id: "neutral", label: "✦ Unisex / Neutral" },
  { id: "masculine", label: "👔 Menswear" },
  { id: "feminine", label: "👗 Womenswear" },
];

const SKIN_TONES = [
  { id: "light_fair", label: "Fair Peach", hex: "#FBE4D8", group: "light" },
  { id: "light_warm", label: "Warm Beige", hex: "#E8C4AE", group: "light" },
  { id: "medium_honey", label: "Honey Bronze", hex: "#D59D7B", group: "medium" },
  { id: "medium_olive", label: "Golden Olive", hex: "#B37D57", group: "medium" },
  { id: "dark_amber", label: "Warm Amber", hex: "#8C593E", group: "dark" },
  { id: "dark_espresso", label: "Deep Espresso", hex: "#4D3123", group: "dark" },
];

const BASE_WEAR_COLORS = [
  { id: "graphite", label: "Minimalist Graphite", hex: "#232326" },
  { id: "sand", label: "Sandstone Oat", hex: "#D8CEBE" },
  { id: "white", label: "Studio White", hex: "#F3F3F5" },
  { id: "terracotta", label: "Terracotta Clay", hex: "#A35D43" },
];

const HEIGHTS = [
  { id: "petite", label: "Petite", scale: 0.94 },
  { id: "regular", label: "Standard", scale: 1.0 },
  { id: "tall", label: "Tall", scale: 1.06 },
];

export function AvatarDesignerStudio({
  initialPreset = "neutral_medium",
  initialPresentation = "neutral",
  initialOutfit,
  onChange,
  onSave,
  className,
  showSaveButton = true,
}: AvatarDesignerStudioProps) {
  // Parse preset
  const [initialBuild, initialSkinGroup] = (initialPreset.split("_") as [BuildType, string]) || [
    "neutral",
    "medium",
  ];

  const [build, setBuild] = useState<BuildType>(
    BUILDS.some((b) => b.id === initialBuild) ? initialBuild : "neutral"
  );
  const [presentation, setPresentation] = useState<StylePresentationType>(initialPresentation);

  // Default skin tone matching group
  const defaultSkin =
    SKIN_TONES.find((s) => s.group === initialSkinGroup) || SKIN_TONES[2];
  const [skinToneHex, setSkinToneHex] = useState(defaultSkin.hex);
  const [baseWearHex, setBaseWearHex] = useState(BASE_WEAR_COLORS[0].hex);
  const [heightScale, setHeightScale] = useState(1.0);

  const [activeTab, setActiveTab] = useState<"figure" | "skin" | "base" | "wardrobe">("wardrobe");
  const [outfitConfig, setOutfitConfig] = useState<MannequinOutfitConfig>(
    initialOutfit || CURATED_OUTFIT_PRESETS[0].outfit
  );

  const [bodyMorphs, setBodyMorphs] = useState<{
    shoulderWidth: number;
    chestBust: number;
    waistScale: number;
    hipWidth: number;
    legFullness: number;
  }>({
    shoulderWidth: 1.0,
    chestBust: 1.0,
    waistScale: 1.0,
    hipWidth: 1.0,
    legFullness: 1.0,
  });

  // Load persisted config if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("atelier_avatar_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.build && BUILDS.some((b) => b.id === parsed.build)) setBuild(parsed.build);
        if (parsed.presentation) setPresentation(parsed.presentation);
        if (parsed.skinToneHex) setSkinToneHex(parsed.skinToneHex);
        if (parsed.baseWearHex) setBaseWearHex(parsed.baseWearHex);
        if (typeof parsed.heightScale === "number") setHeightScale(parsed.heightScale);
        if (parsed.bodyMorphs) setBodyMorphs((prev) => ({ ...prev, ...parsed.bodyMorphs }));
        if (parsed.outfit) setOutfitConfig(parsed.outfit);
      }
    } catch {
      // ignore
    }
  }, []);

  // Derive preset string for backend/storage compatibility
  const currentSkinGroup =
    SKIN_TONES.find((s) => s.hex === skinToneHex)?.group || "medium";
  const mappedPreset = `${build}_${currentSkinGroup}`;

  React.useEffect(() => {
    const cfg = {
      preset: mappedPreset,
      presentation,
      skinToneHex,
      baseWearHex,
      heightScale,
      build,
      bodyMorphs,
      outfit: outfitConfig,
    };
    try {
      localStorage.setItem("atelier_avatar_config", JSON.stringify(cfg));
    } catch {
      // ignore
    }
    if (onChange) {
      onChange(cfg);
    }
  }, [mappedPreset, presentation, skinToneHex, baseWearHex, heightScale, build, bodyMorphs, outfitConfig, onChange]);

  function handleSave() {
    const cfg = {
      preset: mappedPreset,
      presentation,
      skinToneHex,
      baseWearHex,
      heightScale,
      build,
      outfit: outfitConfig,
    };
    try {
      localStorage.setItem("atelier_avatar_config", JSON.stringify(cfg));
    } catch {
      // ignore
    }
    if (onSave) {
      onSave(cfg);
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 3D Interactive Viewport */}
      <div>
        <ThreeMannequinViewer
          build={build}
          skinToneHex={skinToneHex}
          presentation={presentation}
          baseWearHex={baseWearHex}
          heightScale={heightScale}
          bodyMorphs={bodyMorphs}
          autoRotateDefault={false}
          outfit={outfitConfig}
        />
      </div>

      {/* Studio Studio Tabs */}
      <div className="flex border-b-[1.5px] border-ink/20 pb-2 gap-2 overflow-x-auto [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setActiveTab("wardrobe")}
          className={cn(
            "rounded-full border-[1.5px] px-3.5 py-1 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0",
            activeTab === "wardrobe"
              ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
              : "border-transparent text-muted-foreground hover:text-ink"
          )}
        >
          <Shirt className="h-3 w-3" />
          Wardrobe Try-On
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("figure")}
          className={cn(
            "rounded-full border-[1.5px] px-3.5 py-1 text-xs font-bold transition-all shrink-0",
            activeTab === "figure"
              ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
              : "border-transparent text-muted-foreground hover:text-ink"
          )}
        >
          Figure & Build
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("skin")}
          className={cn(
            "rounded-full border-[1.5px] px-3.5 py-1 text-xs font-bold transition-all shrink-0",
            activeTab === "skin"
              ? "border-ink bg-pink shadow-[2px_2px_0px_#1B1B1D]"
              : "border-transparent text-muted-foreground hover:text-ink"
          )}
        >
          Complexion & Tone
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("base")}
          className={cn(
            "rounded-full border-[1.5px] px-3.5 py-1 text-xs font-bold transition-all shrink-0",
            activeTab === "base"
              ? "border-ink bg-mint shadow-[2px_2px_0px_#1B1B1D]"
              : "border-transparent text-muted-foreground hover:text-ink"
          )}
        >
          Base Bodysuit
        </button>
      </div>

      {/* Tab 1: Figure & Build */}
      {activeTab === "figure" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* Style Vibe */}
          <div>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Style Vibe
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESENTATIONS.map((pr) => (
                <button
                  key={pr.id}
                  type="button"
                  onClick={() => setPresentation(pr.id)}
                  className="chip text-[13px]"
                  data-active={presentation === pr.id}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body Build Silhouettes */}
          <div>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Body Silhouette
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {BUILDS.map((b) => {
                const active = build === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBuild(b.id)}
                    className={cn(
                      "card-pop p-3 text-left transition-all active:scale-95 cursor-pointer",
                      active
                        ? "translate-x-[2px] translate-y-[2px] border-ink bg-card shadow-none ring-2 ring-pink"
                        : "hover:bg-muted/40"
                    )}
                    style={{ background: active ? "var(--pink-soft)" : "var(--card)" }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-foreground">{b.label}</p>
                      {active && <Check className="h-3 w-3 text-pink stroke-[3]" />}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-tight">
                      {b.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Height Scale */}
          <div>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Proportion & Stature
            </span>
            <div className="flex gap-2">
              {HEIGHTS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHeightScale(h.scale)}
                  className="chip flex-1 justify-center text-xs"
                  data-active={heightScale === h.scale}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Precision Anatomical Sliders */}
          <div className="rounded-2xl border-[1.5px] border-ink bg-card p-4 shadow-[2px_2px_0px_#1B1B1D]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-foreground">
                ✦ Fine-Tune Body Measurements
              </span>
              <button
                type="button"
                onClick={() =>
                  setBodyMorphs({
                    shoulderWidth: 1.0,
                    chestBust: 1.0,
                    waistScale: 1.0,
                    hipWidth: 1.0,
                    legFullness: 1.0,
                  })
                }
                className="text-[10px] font-bold text-muted-foreground hover:text-pink active:scale-95"
              >
                Reset Sliders
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Shoulders */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-muted-foreground">Shoulder Breadth</span>
                  <span className="text-foreground font-mono">
                    {Math.round(bodyMorphs.shoulderWidth * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.25"
                  step="0.01"
                  value={bodyMorphs.shoulderWidth}
                  onChange={(e) =>
                    setBodyMorphs((prev) => ({
                      ...prev,
                      shoulderWidth: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-pink h-1.5 rounded-lg bg-ink/15 cursor-pointer"
                />
              </div>

              {/* Chest / Bust */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-muted-foreground">Chest / Bust Fullness</span>
                  <span className="text-foreground font-mono">
                    {Math.round(bodyMorphs.chestBust * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.30"
                  step="0.01"
                  value={bodyMorphs.chestBust}
                  onChange={(e) =>
                    setBodyMorphs((prev) => ({
                      ...prev,
                      chestBust: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-pink h-1.5 rounded-lg bg-ink/15 cursor-pointer"
                />
              </div>

              {/* Waist */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-muted-foreground">Waist Taper</span>
                  <span className="text-foreground font-mono">
                    {Math.round(bodyMorphs.waistScale * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="1.25"
                  step="0.01"
                  value={bodyMorphs.waistScale}
                  onChange={(e) =>
                    setBodyMorphs((prev) => ({
                      ...prev,
                      waistScale: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-pink h-1.5 rounded-lg bg-ink/15 cursor-pointer"
                />
              </div>

              {/* Hips & Glutes */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-muted-foreground">Hips & Glutes</span>
                  <span className="text-foreground font-mono">
                    {Math.round(bodyMorphs.hipWidth * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.35"
                  step="0.01"
                  value={bodyMorphs.hipWidth}
                  onChange={(e) =>
                    setBodyMorphs((prev) => ({
                      ...prev,
                      hipWidth: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-pink h-1.5 rounded-lg bg-ink/15 cursor-pointer"
                />
              </div>

              {/* Legs */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-muted-foreground">Leg & Thigh Fullness</span>
                  <span className="text-foreground font-mono">
                    {Math.round(bodyMorphs.legFullness * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.25"
                  step="0.01"
                  value={bodyMorphs.legFullness}
                  onChange={(e) =>
                    setBodyMorphs((prev) => ({
                      ...prev,
                      legFullness: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-pink h-1.5 rounded-lg bg-ink/15 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Complexion & Tone */}
      {activeTab === "skin" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Select Complexion Palette
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {SKIN_TONES.map((st) => {
              const active = skinToneHex === st.hex;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSkinToneHex(st.hex)}
                  className={cn(
                    "card-pop flex items-center gap-3 p-3 text-left transition-all active:scale-95",
                    active
                      ? "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-pink"
                      : "hover:bg-muted/30"
                  )}
                  style={{ background: active ? "var(--card)" : "var(--card)" }}
                >
                  <span
                    className="h-7 w-7 shrink-0 rounded-full border-[1.5px] border-ink shadow-inner flex items-center justify-center"
                    style={{ background: st.hex }}
                  >
                    {active && <Check className="h-3.5 w-3.5 stroke-[3] text-white drop-shadow-sm" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{st.label}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{st.group}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Base Bodysuit */}
      {activeTab === "base" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          <div>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Atelier Base Layer
            </span>
            <p className="text-xs text-muted-foreground mb-3">
              The minimalist undergarment your 3D mannequin wears on the turntable.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {BASE_WEAR_COLORS.map((bw) => {
                const active = baseWearHex === bw.hex;
                return (
                  <button
                    key={bw.id}
                    type="button"
                    onClick={() => setBaseWearHex(bw.hex)}
                    className={cn(
                      "card-pop flex items-center gap-3 p-3 text-left transition-all active:scale-95",
                      active
                        ? "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-pink"
                        : "hover:bg-muted/30"
                    )}
                  >
                    <span
                      className="h-7 w-7 shrink-0 rounded-full border-[1.5px] border-ink shadow-inner flex items-center justify-center"
                      style={{ background: bw.hex }}
                    >
                      {active && (
                        <Check className={cn("h-3.5 w-3.5 stroke-[3]", bw.id === "white" ? "text-ink" : "text-white")} />
                      )}
                    </span>
                    <p className="text-xs font-bold text-foreground">{bw.label}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Wardrobe Try-On */}
      {activeTab === "wardrobe" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* Curated Outfits (1-Click Try On) */}
          <div>
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              ✦ Curated Looks (1-Click Try-On)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CURATED_OUTFIT_PRESETS.map((preset) => {
                const isSelected =
                  outfitConfig.topType === preset.outfit.topType &&
                  outfitConfig.bottomType === preset.outfit.bottomType &&
                  outfitConfig.shoesType === preset.outfit.shoesType;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setOutfitConfig(preset.outfit)}
                    className={cn(
                      "card-pop p-3 text-left transition-all flex items-center justify-between active:scale-95",
                      isSelected
                        ? "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-sun bg-sun/15"
                        : "hover:bg-muted/30"
                    )}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {preset.vibe}
                      </span>
                      <p className="text-xs font-bold text-foreground">{preset.name}</p>
                    </div>
                    {isSelected ? (
                      <span className="h-5 w-5 rounded-full bg-sun border-[1.5px] border-ink flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 stroke-[3] text-ink" />
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-muted-foreground">Fit ✦</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mix & Match Garments */}
          <div className="border-t-[1.5px] border-ink/15 pt-4 space-y-4">
            <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Mix & Match Pieces
            </span>

            {/* Tops */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Top Wear</span>
                <span className="text-[11px] text-muted-foreground capitalize">
                  {outfitConfig.topType || "none"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "none", label: "None" },
                  { id: "tee", label: "Crewneck Tee" },
                  { id: "shirt", label: "Linen Shirt" },
                  { id: "jacket", label: "Trench / Coat" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setOutfitConfig((prev) => ({
                        ...prev,
                        topType: t.id as TopGarmentType,
                      }))
                    }
                    className="chip text-[11px]"
                    data-active={(outfitConfig.topType || "none") === t.id}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {outfitConfig.topType !== "none" && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold">Color:</span>
                  {[
                    { hex: "#F4F0E8", label: "Cream" },
                    { hex: "#2A2A2D", label: "Washed Black" },
                    { hex: "#B58C63", label: "Camel" },
                    { hex: "#FAFAFC", label: "White" },
                    { hex: "#203046", label: "Navy" },
                    { hex: "#A35D43", label: "Terracotta" },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() =>
                        setOutfitConfig((prev) => ({ ...prev, topColor: c.hex }))
                      }
                      title={c.label}
                      className={cn(
                        "h-6 w-6 rounded-full border-[1.5px] border-ink shadow-sm transition-transform hover:scale-110",
                        outfitConfig.topColor === c.hex && "ring-2 ring-sun scale-110"
                      )}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottoms */}
            <div className="space-y-2 pt-2 border-t border-ink/10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Bottom Wear</span>
                <span className="text-[11px] text-muted-foreground capitalize">
                  {outfitConfig.bottomType === "wide_chinos"
                    ? "Wide-Leg Chinos"
                    : outfitConfig.bottomType || "none"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "none", label: "None" },
                  { id: "trousers", label: "Straight Denim" },
                  { id: "wide_chinos", label: "Wide Chinos" },
                  { id: "shorts", label: "Pleated Shorts" },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() =>
                      setOutfitConfig((prev) => ({
                        ...prev,
                        bottomType: b.id as BottomGarmentType,
                      }))
                    }
                    className="chip text-[11px]"
                    data-active={(outfitConfig.bottomType || "none") === b.id}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {outfitConfig.bottomType !== "none" && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold">Color:</span>
                  {[
                    { hex: "#4B5344", label: "Olive" },
                    { hex: "#203046", label: "Selvedge Indigo" },
                    { hex: "#1E1E22", label: "Slate Black" },
                    { hex: "#D8CEBE", label: "Sandstone" },
                    { hex: "#B58C63", label: "Camel" },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() =>
                        setOutfitConfig((prev) => ({ ...prev, bottomColor: c.hex }))
                      }
                      title={c.label}
                      className={cn(
                        "h-6 w-6 rounded-full border-[1.5px] border-ink shadow-sm transition-transform hover:scale-110",
                        outfitConfig.bottomColor === c.hex && "ring-2 ring-sun scale-110"
                      )}
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footwear */}
            <div className="space-y-2 pt-2 border-t border-ink/10">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold">Footwear</span>
                <span className="text-[11px] text-muted-foreground capitalize">
                  {outfitConfig.shoesType || "Bare feet"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "none", label: "Bare Feet" },
                  { id: "sneakers", label: "White Sneakers" },
                  { id: "loafers", label: "Leather Loafers" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setOutfitConfig((prev) => ({
                        ...prev,
                        shoesType: s.id as ShoesGarmentType,
                      }))
                    }
                    className="chip text-[11px]"
                    data-active={(outfitConfig.shoesType || "none") === s.id}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button (Optional when embedded in wizard) */}
      {showSaveButton && onSave && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="btn-pop w-full py-3.5 text-base"
            data-tone="pink"
          >
            <Sparkles className="h-4 w-4" /> Save 3D Mannequin
          </button>
        </div>
      )}
    </div>
  );
}
