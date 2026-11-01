import React, { useState, useEffect, useRef } from "react";
import {
  ThreeMannequinViewer,
  BuildType,
  StylePresentationType,
  MannequinOutfitConfig,
  ModelPresetType,
  HairstyleType,
  EyewearType,
  CameraFocusTarget,
  FashionStanceType,
} from "./ThreeMannequinViewer";
import { cn } from "@/lib/utils";
import {
  Check,
  User,
  Smile,
  Sparkles,
  Shirt,
  Menu,
  RotateCcw,
  LogOut,
  ArrowRight,
  Glasses,
} from "lucide-react";

export type StudioTab = "body" | "face" | "hair" | "outfit";
export type BodyFrameType = "slim" | "athletic" | "curvy" | "average";

export interface AvatarDesignerStudioProps {
  initialPreset?: string;
  initialPresentation?: StylePresentationType;
  initialOutfit?: MannequinOutfitConfig;
  initialModelType?: ModelPresetType;
  initialHairStyle?: HairstyleType;
  initialHairColorHex?: string;
  initialEyewear?: EyewearType;
  currentStep?: number;
  onContinue?: () => void;
  onBack?: () => void;
  onRestart?: () => void;
  onExit?: () => void;
  onChange?: (config: {
    preset: string;
    presentation: StylePresentationType;
    skinToneHex: string;
    baseWearHex: string;
    heightScale: number;
    modelType?: ModelPresetType;
    hairStyle?: HairstyleType;
    hairColorHex?: string;
    eyewear?: EyewearType;
    outfit?: MannequinOutfitConfig;
  }) => void;
  onSave?: (config: {
    preset: string;
    presentation: StylePresentationType;
    skinToneHex: string;
    baseWearHex: string;
    heightScale: number;
    modelType?: ModelPresetType;
    hairStyle?: HairstyleType;
    hairColorHex?: string;
    eyewear?: EyewearType;
    outfit?: MannequinOutfitConfig;
  }) => void;
  className?: string;
  showSaveButton?: boolean;
}

export const SKIN_TONES = [
  { id: "porcelain", label: "Porcelain Fair", hex: "#FBECE2" },
  { id: "fair", label: "Warm Ivory", hex: "#F3D5C0" },
  { id: "wheat", label: "Golden Honey", hex: "#D59D7B" },
  { id: "olive", label: "Rich Caramel", hex: "#B8784C" },
  { id: "almond", label: "Warm Bronze", hex: "#8F5433" },
  { id: "espresso", label: "Deep Espresso", hex: "#5E3622" },
  { id: "ebony", label: "Rich Ebony", hex: "#3B2216" },
];

export const BODY_FRAMES: {
  id: BodyFrameType;
  label: string;
  build: BuildType;
  morphs: { shoulderWidth: number; waistScale: number; hipWidth: number; chestBust: number };
}[] = [
  {
    id: "slim",
    label: "Slim",
    build: "slim",
    morphs: { shoulderWidth: 0.92, waistScale: 0.88, hipWidth: 0.9, chestBust: 0.9 },
  },
  {
    id: "athletic",
    label: "Athletic",
    build: "neutral",
    morphs: { shoulderWidth: 1.12, waistScale: 0.95, hipWidth: 0.98, chestBust: 1.08 },
  },
  {
    id: "curvy",
    label: "Curvy",
    build: "curvy",
    morphs: { shoulderWidth: 1.05, waistScale: 1.05, hipWidth: 1.25, chestBust: 1.18 },
  },
  {
    id: "average",
    label: "Average",
    build: "neutral",
    morphs: { shoulderWidth: 1.0, waistScale: 1.0, hipWidth: 1.0, chestBust: 1.0 },
  },
];

export const HAIRSTYLES: { id: HairstyleType; label: string }[] = [
  { id: "wavy_curtains", label: "Wavy Curtains" },
  { id: "fade", label: "Textured Fade" },
  { id: "sleek_bob", label: "Editorial Bob" },
  { id: "high_ponytail", label: "High Ponytail" },
  { id: "afro_curls", label: "Afro Curls" },
  { id: "chic_beanie", label: "Chic Beanie" },
  { id: "none", label: "No Hair" },
];

export const HAIR_COLORS = [
  { id: "jet_black", label: "Jet Black", hex: "#18181A" },
  { id: "espresso", label: "Espresso", hex: "#3B281C" },
  { id: "chestnut", label: "Chestnut", hex: "#63432B" },
  { id: "honey_blonde", label: "Honey Blonde", hex: "#C79C64" },
  { id: "auburn", label: "Auburn Copper", hex: "#8A3824" },
  { id: "platinum", label: "Platinum Ash", hex: "#D6D1CA" },
  { id: "pastel_lilac", label: "Pastel Lilac", hex: "#8D80AD" },
];

export const FASHION_STANCES: { id: FashionStanceType; label: string }[] = [
  { id: "runway_confident", label: "Runway Confident" },
  { id: "casual_streetwear", label: "Casual Streetwear" },
  { id: "editorial_chic", label: "Editorial Chic" },
  { id: "neutral_pose", label: "Natural Rest" },
];

export const AVATAR_TWINS = [
  {
    id: "/models/female-twin.glb",
    label: "Female Stylized Twin",
    badge: "✦ Womenswear",
    presentation: "feminine" as StylePresentationType,
  },
  {
    id: "/models/male-twin.glb",
    label: "Male Stylized Twin",
    badge: "✦ Menswear",
    presentation: "masculine" as StylePresentationType,
  },
];

interface StudioHistoryState {
  modelType: ModelPresetType;
  skinToneHex: string;
  bodyFrame: BodyFrameType;
  heightCm: number;
  shoulderPct: number;
  waistPct: number;
  hairStyle: HairstyleType;
  hairColorHex: string;
  stance: FashionStanceType;
}

export function AvatarDesignerStudio({
  initialPreset = "neutral_medium",
  initialPresentation = "feminine",
  initialOutfit,
  initialModelType,
  initialHairStyle = "wavy_curtains",
  initialHairColorHex = "#18181A",
  initialEyewear = "none",
  currentStep = 1,
  onContinue,
  onBack,
  onRestart,
  onExit,
  onChange,
  onSave,
  className,
  showSaveButton = false,
}: AvatarDesignerStudioProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<StudioTab>("body");

  // Model & Twin Presentation
  const [modelType, setModelType] = useState<ModelPresetType>(() => {
    if (initialModelType && (initialModelType.includes("female") || initialModelType.includes("male"))) {
      return initialModelType;
    }
    return initialPresentation === "masculine" ? "/models/male-twin.glb" : "/models/female-twin.glb";
  });

  const [presentation, setPresentation] = useState<StylePresentationType>(initialPresentation);

  // Body Frame & Proportions
  const [bodyFrame, setBodyFrame] = useState<BodyFrameType>(() => {
    if (initialPreset?.includes("slim")) return "slim";
    if (initialPreset?.includes("curvy")) return "curvy";
    return "athletic";
  });

  const [heightCm, setHeightCm] = useState<number>(165);
  const [shoulderPct, setShoulderPct] = useState<number>(50);
  const [waistPct, setWaistPct] = useState<number>(48);

  // Skin Tone
  const [skinToneHex, setSkinToneHex] = useState<string>(() => {
    if (initialPreset?.includes("light")) return "#F3D5C0";
    if (initialPreset?.includes("dark")) return "#8F5433";
    return "#D59D7B";
  });

  // Hair & Face
  const [hairStyle, setHairStyle] = useState<HairstyleType>(initialHairStyle);
  const [hairColorHex, setHairColorHex] = useState<string>(initialHairColorHex);
  const [eyewear, setEyewear] = useState<EyewearType>(initialEyewear);
  const [stance, setStance] = useState<FashionStanceType>("runway_confident");

  // Outfits
  const [outfit, setOutfit] = useState<MannequinOutfitConfig>(
    initialOutfit || {
      topType: "tee",
      topColor: "#222226",
      bottomType: "trousers",
      bottomColor: "#18181A",
      shoesType: "sneakers",
      shoesColor: "#6B3A5B",
    }
  );

  // Camera Focus
  const [cameraFocus, setCameraFocus] = useState<CameraFocusTarget>("full");

  // Undo History Stack
  const historyRef = useRef<StudioHistoryState[]>([]);

  const pushHistory = () => {
    const current: StudioHistoryState = {
      modelType,
      skinToneHex,
      bodyFrame,
      heightCm,
      shoulderPct,
      waistPct,
      hairStyle,
      hairColorHex,
      stance,
    };
    historyRef.current.push(current);
    if (historyRef.current.length > 20) historyRef.current.shift();
  };

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    setModelType(prev.modelType);
    setSkinToneHex(prev.skinToneHex);
    setBodyFrame(prev.bodyFrame);
    setHeightCm(prev.heightCm);
    setShoulderPct(prev.shoulderPct);
    setWaistPct(prev.waistPct);
    setHairStyle(prev.hairStyle);
    setHairColorHex(prev.hairColorHex);
    setStance(prev.stance);
  };

  // Convert heightCm to heightScale (170cm = 1.0)
  const heightScale = Math.max(0.88, Math.min(1.12, heightCm / 170));

  // Compute active body morphs
  const currentFrameObj = BODY_FRAMES.find((f) => f.id === bodyFrame) || BODY_FRAMES[1];
  const shoulderFactor = (shoulderPct / 50); // 1.0 at 50%
  const waistFactor = (waistPct / 50);

  const activeMorphs = {
    shoulderWidth: currentFrameObj.morphs.shoulderWidth * shoulderFactor,
    waistScale: currentFrameObj.morphs.waistScale * waistFactor,
    hipWidth: currentFrameObj.morphs.hipWidth,
    chestBust: currentFrameObj.morphs.chestBust,
  };

  // Emit changes to parent
  useEffect(() => {
    onChange?.({
      preset: `${bodyFrame}_custom`,
      presentation,
      skinToneHex,
      baseWearHex: "#18181A",
      heightScale,
      modelType,
      hairStyle,
      hairColorHex,
      eyewear,
      outfit,
    });
  }, [bodyFrame, presentation, skinToneHex, heightScale, modelType, hairStyle, hairColorHex, eyewear, outfit]);

  // Restart / Reset action
  const handleRestart = () => {
    if (onRestart) {
      onRestart();
      return;
    }
    pushHistory();
    setBodyFrame("athletic");
    setHeightCm(165);
    setShoulderPct(50);
    setWaistPct(48);
    setSkinToneHex("#D59D7B");
    setHairStyle("wavy_curtains");
    setStance("runway_confident");
  };

  // Continue action
  const handleContinue = () => {
    const config = {
      preset: `${bodyFrame}_custom`,
      presentation,
      skinToneHex,
      baseWearHex: "#18181A",
      heightScale,
      modelType,
      hairStyle,
      hairColorHex,
      eyewear,
      outfit,
    };
    if (showSaveButton && onSave) {
      onSave(config);
      return;
    }
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div className={cn("h-full w-full select-none overflow-hidden", className)}>
      {/* =========================================================================
          DESKTOP DEDICATED VIEW (hidden on mobile, visible md+) - ZERO SCROLL
         ========================================================================= */}
      <div className="hidden md:flex h-full w-full max-w-[1360px] mx-auto p-4 flex-col justify-center">
        <div className="flex flex-col h-[94dvh] w-full rounded-[32px] border-2 border-ink bg-[#FFFDF9] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          {/* Top Yellow Window Header */}
          <div className="h-14 shrink-0 bg-[#FFE169] border-b-2 border-ink px-6 flex items-center justify-between">
            {/* Left: Brand & Dot */}
            <div className="flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 rounded-full bg-[#FF8096] border border-ink shadow-2xs" />
              <span className="text-base font-black tracking-tight text-ink flex items-center gap-1">
                <span>⚡</span> WhatShouldIWear
              </span>
            </div>

            {/* Center: 3 Progress Indicator Pills */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-2.5 w-10 rounded-full border border-ink transition-colors",
                    i <= currentStep ? "bg-[#FF8096]" : "bg-white"
                  )}
                />
              ))}
            </div>

            {/* Right: Restart & Exit Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestart}
                className="flex items-center gap-1.5 rounded-full border border-ink bg-white px-3.5 py-1 text-xs font-bold text-ink shadow-2xs hover:bg-neutral-100 active:scale-95 transition-transform"
                title="Restart Avatar Customization"
              >
                <RotateCcw className="h-3 w-3 stroke-[2.5]" />
                <span>Restart</span>
              </button>
              <button
                type="button"
                onClick={onExit || onBack}
                className="flex items-center gap-1.5 rounded-full border border-ink bg-white px-3.5 py-1 text-xs font-bold text-ink shadow-2xs hover:bg-neutral-100 active:scale-95 transition-transform"
                title="Exit"
              >
                <LogOut className="h-3 w-3 stroke-[2.5]" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Content Area */}
          <div className="flex-1 min-h-0 flex gap-6 p-6 overflow-hidden">
            {/* LEFT COLUMN: Interactive 3D Mannequin Viewport */}
            <div className="w-1/2 h-full flex flex-col relative rounded-3xl overflow-hidden">
              <ThreeMannequinViewer
                modelType={modelType}
                build={currentFrameObj.build}
                skinToneHex={skinToneHex}
                heightScale={heightScale}
                hairStyle={hairStyle}
                hairColorHex={hairColorHex}
                eyewear={eyewear}
                presentation={presentation}
                stance={stance}
                outfit={outfit}
                cameraFocus={cameraFocus}
                onFocusChange={setCameraFocus}
                onUndo={historyRef.current.length > 0 ? handleUndo : undefined}
                showFocusTabs={true}
                className="w-full h-full"
              />
            </div>

            {/* RIGHT COLUMN: Customization Studio Panel */}
            <div className="w-1/2 h-full flex flex-col justify-between overflow-hidden py-1">
              {/* Badges Header */}
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-ink bg-[#FF8096] px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-ink shadow-2xs">
                  3D MANNEQUIN STUDIO
                </span>
                <span className="flex items-center gap-1 rounded-full border border-ink bg-[#B6F3D6] px-3 py-0.5 text-[11px] font-bold text-ink shadow-2xs">
                  <Check className="h-3 w-3 stroke-[3]" />
                  <span>Changes apply instantly</span>
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-2">
                <h1 className="text-3xl font-black tracking-tight text-ink flex items-center gap-2">
                  <span>Design your</span>
                  <span className="rounded-xl border border-ink bg-[#7BE495] px-2.5 py-0.5 font-black inline-block shadow-2xs">
                    mannequin
                  </span>
                </h1>
                <p className="mt-1 text-xs text-muted-foreground font-semibold">
                  Make it yours, then style your look.
                </p>
              </div>

              {/* Category Tab Pills */}
              <div className="flex items-center gap-2 mt-3">
                {[
                  { id: "body" as const, label: "Body", icon: User },
                  { id: "face" as const, label: "Face", icon: Smile },
                  { id: "hair" as const, label: "Hair", icon: Sparkles },
                  { id: "outfit" as const, label: "Outfit", icon: Shirt },
                ].map((t) => {
                  const isActive = activeTab === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all border border-ink shadow-2xs",
                        isActive
                          ? "bg-[#FFE169] border-2 border-ink shadow-xs scale-102 font-black"
                          : "bg-white text-ink hover:bg-neutral-50"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>{t.label}</span>
                      {isActive && <Check className="h-3 w-3 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Customization Card */}
              <div className="flex-1 min-h-0 bg-white rounded-3xl border-2 border-ink p-4 flex flex-col justify-around my-3 shadow-xs overflow-hidden">
                {activeTab === "body" && (
                  <>
                    {/* 1. Body Frame */}
                    <div>
                      <span className="block text-xs font-black text-ink mb-2">
                        Body Frame
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {BODY_FRAMES.map((f) => {
                          const isSelected = bodyFrame === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setBodyFrame(f.id);
                              }}
                              className={cn(
                                "relative flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all shadow-2xs",
                                isSelected
                                  ? "border-2 border-ink bg-[#FFE169] font-black shadow-xs scale-102"
                                  : "border-ink/40 bg-white hover:border-ink font-semibold"
                              )}
                            >
                              {isSelected && (
                                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-white">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                </span>
                              )}
                              <BodySilhouetteIcon type={f.id} isSelected={isSelected} />
                              <span className="mt-1 text-[11px]">{f.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Height Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-black text-ink mb-1">
                        <span>Height</span>
                        <span className="font-black text-sm">{heightCm} cm</span>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="range"
                          min={150}
                          max={190}
                          value={heightCm}
                          onChange={(e) => setHeightCm(Number(e.target.value))}
                          className="w-full accent-[#FFE169] h-2 rounded-lg cursor-pointer bg-neutral-200 border border-ink/20"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mt-0.5">
                        <span>150 cm</span>
                        <span>190 cm</span>
                      </div>
                    </div>

                    {/* 3. Skin Tone Swatches */}
                    <div>
                      <span className="block text-xs font-black text-ink mb-2">
                        Skin Tone
                      </span>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {SKIN_TONES.map((s) => {
                          const isSelected = skinToneHex.toLowerCase() === s.hex.toLowerCase();
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setSkinToneHex(s.hex);
                              }}
                              className={cn(
                                "relative h-8 w-8 rounded-full border-2 border-ink transition-transform active:scale-90 shadow-2xs",
                                isSelected && "ring-2 ring-[#FFE169] ring-offset-2 scale-110"
                              )}
                              style={{ backgroundColor: s.hex }}
                              title={s.label}
                            >
                              {isSelected && (
                                <Check className="absolute inset-0 m-auto h-4 w-4 stroke-[3] text-ink drop-shadow-xs" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Proportions */}
                    <div>
                      <span className="block text-xs font-black text-ink mb-1">
                        Proportions
                      </span>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-ink">
                          <span className="w-28">Shoulder Width</span>
                          <input
                            type="range"
                            min={30}
                            max={70}
                            value={shoulderPct}
                            onChange={(e) => setShoulderPct(Number(e.target.value))}
                            className="flex-1 mx-2 accent-[#FFE169] h-2 rounded-lg cursor-pointer bg-neutral-200"
                          />
                          <span className="w-10 text-right font-black">{shoulderPct}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-ink">
                          <span className="w-28">Waist Width</span>
                          <input
                            type="range"
                            min={30}
                            max={70}
                            value={waistPct}
                            onChange={(e) => setWaistPct(Number(e.target.value))}
                            className="flex-1 mx-2 accent-[#FFE169] h-2 rounded-lg cursor-pointer bg-neutral-200"
                          />
                          <span className="w-10 text-right font-black">{waistPct}%</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "face" && (
                  <div className="flex flex-col justify-around h-full space-y-3">
                    <div>
                      <span className="block text-xs font-black text-ink mb-2">
                        Stylized Digital Twin Base
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        {AVATAR_TWINS.map((t) => {
                          const isSelected = modelType === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setModelType(t.id);
                                setPresentation(t.presentation);
                              }}
                              className={cn(
                                "flex flex-col items-center justify-center rounded-2xl border p-3 transition-all",
                                isSelected
                                  ? "border-2 border-ink bg-[#FFE169] font-black shadow-xs"
                                  : "border-ink/40 bg-white hover:border-ink font-semibold"
                              )}
                            >
                              <span className="text-xs font-bold text-muted-foreground">{t.badge}</span>
                              <span className="text-sm font-black mt-0.5">{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-black text-ink mb-2">
                        Fashion Runway Posture
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {FASHION_STANCES.map((st) => {
                          const isSelected = stance === st.id;
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setStance(st.id);
                              }}
                              className={cn(
                                "rounded-xl border px-3 py-2 text-xs transition-all",
                                isSelected
                                  ? "border-2 border-ink bg-[#FFE169] font-black shadow-2xs"
                                  : "border-ink/40 bg-white hover:border-ink font-semibold"
                              )}
                            >
                              {st.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "hair" && (
                  <div className="flex flex-col justify-around h-full space-y-3">
                    <div>
                      <span className="block text-xs font-black text-ink mb-2">
                        Hairstyle Silhouette
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {HAIRSTYLES.map((h) => {
                          const isSelected = hairStyle === h.id;
                          return (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setHairStyle(h.id);
                              }}
                              className={cn(
                                "rounded-xl border px-2.5 py-2 text-[11px] transition-all",
                                isSelected
                                  ? "border-2 border-ink bg-[#FFE169] font-black shadow-2xs"
                                  : "border-ink/40 bg-white hover:border-ink font-semibold"
                              )}
                            >
                              {h.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-black text-ink mb-2">
                        Hair Tint Color
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {HAIR_COLORS.map((c) => {
                          const isSelected = hairColorHex.toLowerCase() === c.hex.toLowerCase();
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setHairColorHex(c.hex);
                              }}
                              className={cn(
                                "relative h-7 w-7 rounded-full border-2 border-ink shadow-2xs transition-transform active:scale-90",
                                isSelected && "ring-2 ring-[#FFE169] ring-offset-2 scale-110"
                              )}
                              style={{ backgroundColor: c.hex }}
                              title={c.label}
                            >
                              {isSelected && (
                                <Check className="absolute inset-0 m-auto h-3.5 w-3.5 stroke-[3] text-white drop-shadow-xs" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "outfit" && (
                  <div className="flex flex-col justify-around h-full space-y-3">
                    <div>
                      <span className="block text-xs font-black text-ink mb-1.5">
                        Top Garment
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(["tee", "shirt", "jacket", "none"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              pushHistory();
                              setOutfit((prev) => ({ ...prev, topType: t }));
                            }}
                            className={cn(
                              "rounded-xl border py-1.5 text-xs capitalize transition-all",
                              outfit.topType === t
                                ? "border-2 border-ink bg-[#FFE169] font-black shadow-2xs"
                                : "border-ink/40 bg-white hover:border-ink font-semibold"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-black text-ink mb-1.5">
                        Bottom Garment
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(["trousers", "wide_chinos", "shorts", "none"] as const).map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              pushHistory();
                              setOutfit((prev) => ({ ...prev, bottomType: b }));
                            }}
                            className={cn(
                              "rounded-xl border py-1.5 text-xs capitalize transition-all",
                              outfit.bottomType === b
                                ? "border-2 border-ink bg-[#FFE169] font-black shadow-2xs"
                                : "border-ink/40 bg-white hover:border-ink font-semibold"
                            )}
                          >
                            {b.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-black text-ink mb-1.5">
                        Footwear & Glasses
                      </span>
                      <div className="flex items-center gap-2">
                        {(["sneakers", "loafers", "none"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              pushHistory();
                              setOutfit((prev) => ({ ...prev, shoesType: s }));
                            }}
                            className={cn(
                              "flex-1 rounded-xl border py-1.5 text-xs capitalize transition-all",
                              outfit.shoesType === s
                                ? "border-2 border-ink bg-[#FFE169] font-black shadow-2xs"
                                : "border-ink/40 bg-white hover:border-ink font-semibold"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            pushHistory();
                            setEyewear((prev) => (prev === "none" ? "designer_sunglasses" : "none"));
                          }}
                          className={cn(
                            "rounded-xl border px-3 py-1.5 text-xs flex items-center gap-1 transition-all",
                            eyewear !== "none"
                              ? "border-2 border-ink bg-[#FFE169] font-black shadow-2xs"
                              : "border-ink/40 bg-white hover:border-ink font-semibold"
                          )}
                        >
                          <Glasses className="h-3.5 w-3.5" />
                          <span>Glasses</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Button (Desktop Pink Pill) */}
              <button
                type="button"
                onClick={handleContinue}
                className="w-full rounded-full border-2 border-ink bg-[#FF8096] hover:bg-[#ff6c83] py-3.5 text-base font-black text-ink shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>{showSaveButton ? "Save & Apply Look" : "Continue to outfits"}</span>
                <ArrowRight className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE DEDICATED VIEW (visible on mobile <md, hidden md+) - ZERO SCROLL
         ========================================================================= */}
      <div className="flex md:hidden h-full w-full flex-col justify-between p-3 overflow-hidden bg-[#FAF0E6]">
        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between shrink-0">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink bg-white shadow-2xs"
            aria-label="Menu"
          >
            <Menu className="h-4 w-4 stroke-[2.5]" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-sm font-black tracking-tight text-ink flex items-center gap-1">
              <span>⚡</span> WhatShouldIWear
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-6 rounded-full border border-ink transition-colors",
                    i <= currentStep ? "bg-[#FF8096]" : "bg-white"
                  )}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ink bg-white shadow-2xs"
            aria-label="Restart"
          >
            <RotateCcw className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Mobile Title Section */}
        <div className="text-center my-1.5 shrink-0">
          <h1 className="text-xl font-black text-ink flex items-center justify-center gap-1.5">
            <span>Design your</span>
            <span className="rounded-lg border border-ink bg-[#7BE495] px-2 py-0.5 text-base font-black">
              mannequin
            </span>
          </h1>
          <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
            Make it yours, then style your look.
          </p>
        </div>

        {/* Mobile 3D Viewport Card */}
        <div className="flex-1 min-h-[220px] max-h-[38vh] w-full rounded-2xl border-2 border-ink overflow-hidden my-1 relative shadow-xs bg-white">
          <ThreeMannequinViewer
            modelType={modelType}
            build={currentFrameObj.build}
            skinToneHex={skinToneHex}
            heightScale={heightScale}
            hairStyle={hairStyle}
            hairColorHex={hairColorHex}
            eyewear={eyewear}
            presentation={presentation}
            stance={stance}
            outfit={outfit}
            cameraFocus={cameraFocus}
            onFocusChange={setCameraFocus}
            onUndo={historyRef.current.length > 0 ? handleUndo : undefined}
            showFocusTabs={false}
            className="w-full h-full"
          />
        </div>

        {/* Mobile Category Tabs */}
        <div className="flex items-center justify-between gap-1.5 my-1.5 shrink-0">
          {[
            { id: "body" as const, label: "Body", icon: User },
            { id: "face" as const, label: "Face", icon: Smile },
            { id: "hair" as const, label: "Hair", icon: Sparkles },
            { id: "outfit" as const, label: "Outfit", icon: Shirt },
          ].map((t) => {
            const isActive = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 rounded-full py-1.5 text-xs font-bold border border-ink shadow-2xs transition-all",
                  isActive
                    ? "bg-[#FFE169] border-2 border-ink font-black shadow-xs"
                    : "bg-white text-ink"
                )}
              >
                <Icon className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Customization Sheet Card */}
        <div className="bg-white rounded-2xl border-2 border-ink p-3 space-y-2 shadow-xs shrink-0">
          {activeTab === "body" && (
            <>
              {/* Skin Tone Row */}
              <div>
                <span className="block text-[11px] font-black text-ink mb-1.5">
                  Skin Tone
                </span>
                <div className="flex items-center justify-between">
                  {SKIN_TONES.map((s) => {
                    const isSelected = skinToneHex.toLowerCase() === s.hex.toLowerCase();
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          pushHistory();
                          setSkinToneHex(s.hex);
                        }}
                        className={cn(
                          "relative h-7 w-7 rounded-full border-2 border-ink shadow-2xs",
                          isSelected && "ring-2 ring-[#FFE169] scale-110"
                        )}
                        style={{ backgroundColor: s.hex }}
                        title={s.label}
                      >
                        {isSelected && (
                          <Check className="absolute inset-0 m-auto h-3.5 w-3.5 stroke-[3] text-ink drop-shadow-xs" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Body Frame Row */}
              <div>
                <span className="block text-[11px] font-black text-ink mb-1.5">
                  Body Frame
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {BODY_FRAMES.map((f) => {
                    const isSelected = bodyFrame === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          pushHistory();
                          setBodyFrame(f.id);
                        }}
                        className={cn(
                          "relative flex flex-col items-center justify-center rounded-xl border py-1.5 transition-all shadow-2xs",
                          isSelected
                            ? "border-2 border-ink bg-[#FFE169] font-black"
                            : "border-ink/40 bg-white font-semibold"
                        )}
                      >
                        {isSelected && (
                          <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-white">
                            <Check className="h-2 w-2 stroke-[3]" />
                          </span>
                        )}
                        <BodySilhouetteIcon type={f.id} isSelected={isSelected} small />
                        <span className="text-[10px] mt-0.5">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === "face" && (
            <div className="space-y-2">
              <span className="block text-[11px] font-black text-ink">Avatar Twin</span>
              <div className="grid grid-cols-2 gap-2">
                {AVATAR_TWINS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      pushHistory();
                      setModelType(t.id);
                      setPresentation(t.presentation);
                    }}
                    className={cn(
                      "rounded-xl border py-2 text-xs font-bold transition-all",
                      modelType === t.id
                        ? "border-2 border-ink bg-[#FFE169] font-black"
                        : "border-ink/40 bg-white"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "hair" && (
            <div className="space-y-2">
              <span className="block text-[11px] font-black text-ink">Hairstyle</span>
              <div className="grid grid-cols-3 gap-1.5">
                {HAIRSTYLES.slice(0, 6).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      pushHistory();
                      setHairStyle(h.id);
                    }}
                    className={cn(
                      "rounded-xl border py-1.5 text-[10px] transition-all",
                      hairStyle === h.id
                        ? "border-2 border-ink bg-[#FFE169] font-black"
                        : "border-ink/40 bg-white"
                    )}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "outfit" && (
            <div className="space-y-2">
              <span className="block text-[11px] font-black text-ink">Quick Fit</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(["tee", "shirt", "jacket"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      pushHistory();
                      setOutfit((prev) => ({ ...prev, topType: t }));
                    }}
                    className={cn(
                      "rounded-xl border py-1.5 text-xs capitalize transition-all",
                      outfit.topType === t
                        ? "border-2 border-ink bg-[#FFE169] font-black"
                        : "border-ink/40 bg-white"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Action Bar */}
        <div className="flex items-center gap-2.5 mt-2 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border-2 border-ink bg-white px-6 py-2.5 text-xs font-black text-ink shadow-2xs hover:bg-neutral-100 active:scale-95 transition-transform"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 rounded-full border-2 border-ink bg-[#FF8096] hover:bg-[#ff6c83] py-2.5 text-xs font-black text-ink shadow-2xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <span>Next</span>
            <ArrowRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Minimalist stylized body silhouette SVG icon matching the mockup
function BodySilhouetteIcon({
  type,
  isSelected,
  small = false,
}: {
  type: BodyFrameType;
  isSelected?: boolean;
  small?: boolean;
}) {
  const size = small ? "h-6 w-5" : "h-9 w-7";

  return (
    <svg
      className={cn(size, "text-ink transition-transform", isSelected && "scale-105")}
      viewBox="0 0 24 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Head */}
      <circle cx="12" cy="5" r="3.2" fill={isSelected ? "#FFE169" : "none"} />

      {/* Torso & Limbs silhouette based on frame */}
      {type === "slim" && (
        <path
          d="M8.5 11c0 3 1.5 5 1.5 9l-1 10M15.5 11c0 3-1.5 5-1.5 9l1 10M8.5 11h7"
          strokeWidth="1.8"
        />
      )}
      {type === "athletic" && (
        <path
          d="M6.5 11c1.5 3 2.5 5 2.5 9l-1 10M17.5 11c-1.5 3-2.5 5-2.5 9l1 10M6.5 11h11"
          strokeWidth="2.2"
        />
      )}
      {type === "curvy" && (
        <path
          d="M7.5 11c1 3-0.5 5 1.5 9l-1 10M16.5 11c-1 3 0.5 5-1.5 9l1 10M7.5 11h9"
          strokeWidth="2"
        />
      )}
      {type === "average" && (
        <path
          d="M7.5 11c0.5 3 1 5 1.5 9l-1 10M16.5 11c-0.5 3-1 5-1.5 9l1 10M7.5 11h9"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
