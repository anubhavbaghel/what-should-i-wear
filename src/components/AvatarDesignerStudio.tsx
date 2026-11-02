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
  BodyMorphConfig,
} from "./ThreeMannequinViewer";
import { AvatarConfig, BodyFrameType, mapToStandardPreset } from "@/lib/avatar.types";
import { calculateEffectiveMultipliers, PRESET_BASE_MULTIPLIERS } from "@/lib/avatar-transform";
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
  Eye,
  ChevronDown,
  ChevronUp,
  Undo2,
  ArrowLeft,
  Sliders,
} from "lucide-react";

export type StudioTab = "body" | "face" | "hair" | "outfit" | "avatar";
export type { BodyFrameType };

const MOBILE_CATEGORIES: {
  id: StudioTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "avatar", label: "Avatar", icon: User },
  { id: "body", label: "Body", icon: Sliders },
  { id: "face", label: "Face", icon: Smile },
  { id: "hair", label: "Hair", icon: Sparkles },
  { id: "outfit", label: "Outfit", icon: Shirt },
];

export interface AvatarDesignerStudioProps {
  initialConfig?: AvatarConfig;
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
    avatarConfig?: AvatarConfig;
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
    avatarConfig?: AvatarConfig;
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
    morphs: { shoulderWidth: 0.9, waistScale: 0.88, hipWidth: 0.92, chestBust: 0.9 },
  },
  {
    id: "athletic",
    label: "Athletic",
    build: "neutral",
    morphs: { shoulderWidth: 1.15, waistScale: 0.95, hipWidth: 0.98, chestBust: 1.1 },
  },
  {
    id: "curvy",
    label: "Curvy",
    build: "curvy",
    morphs: { shoulderWidth: 1.02, waistScale: 1.05, hipWidth: 1.2, chestBust: 1.15 },
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
  eyewear: EyewearType;
  stance: FashionStanceType;
}

export function AvatarDesignerStudio({
  initialConfig,
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

  // Mobile sheet collapse state
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(true);

  // Development comparison toggle (A/B testing default vs customized body)
  const [isComparingDefault, setIsComparingDefault] = useState<boolean>(false);

  // Model & Twin Presentation
  const [modelType, setModelType] = useState<ModelPresetType>(() => {
    if (initialConfig?.modelType) return initialConfig.modelType as ModelPresetType;
    if (
      initialModelType &&
      (initialModelType.includes("female") || initialModelType.includes("male"))
    ) {
      return initialModelType;
    }
    const pres = initialConfig?.presentation || initialPresentation;
    return pres === "masculine" ? "/models/male-twin.glb" : "/models/female-twin.glb";
  });

  const [presentation, setPresentation] = useState<StylePresentationType>(
    initialConfig?.presentation || initialPresentation,
  );

  // Body Frame & Proportions
  const [bodyFrame, setBodyFrame] = useState<BodyFrameType>(() => {
    if (initialConfig?.bodyFrame) return initialConfig.bodyFrame;
    if (initialPreset?.includes("slim")) return "slim";
    if (initialPreset?.includes("curvy")) return "curvy";
    return "athletic";
  });

  const [heightCm, setHeightCm] = useState<number>(initialConfig?.heightCm ?? 165);
  const [shoulderPct, setShoulderPct] = useState<number>(initialConfig?.shoulderPct ?? 50);
  const [waistPct, setWaistPct] = useState<number>(initialConfig?.waistPct ?? 48);

  // Skin Tone
  const [skinToneHex, setSkinToneHex] = useState<string>(() => {
    if (initialConfig?.skinToneHex) return initialConfig.skinToneHex;
    if (initialPreset?.includes("light")) return "#F3D5C0";
    if (initialPreset?.includes("dark")) return "#8F5433";
    return "#D59D7B";
  });

  // Hair & Face
  const [hairStyle, setHairStyle] = useState<HairstyleType>(
    (initialConfig?.hairStyle as HairstyleType) || initialHairStyle,
  );
  const [hairColorHex, setHairColorHex] = useState<string>(
    initialConfig?.hairColorHex || initialHairColorHex,
  );
  const [eyewear, setEyewear] = useState<EyewearType>(
    (initialConfig?.eyewear as EyewearType) || initialEyewear,
  );
  const [stance, setStance] = useState<FashionStanceType>(
    initialConfig?.stance || "runway_confident",
  );

  // Outfits
  const [outfit, setOutfit] = useState<MannequinOutfitConfig>(
    initialConfig?.outfit ||
      initialOutfit || {
        topType: "tee",
        topColor: "#222226",
        bottomType: "trousers",
        bottomColor: "#18181A",
        shoesType: "sneakers",
        shoesColor: "#6B3A5B",
      },
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
      eyewear,
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
    setEyewear(prev.eyewear);
    setStance(prev.stance);
  };

  // Deterministic body multipliers calculated from preset and sliders
  const currentFrameObj = BODY_FRAMES.find((f) => f.id === bodyFrame) || BODY_FRAMES[1];
  const effective = calculateEffectiveMultipliers({
    bodyFrame,
    shoulderPct,
    waistPct,
    heightCm,
  });
  const heightScale = effective.heightScale;
  const activeMorphs: BodyMorphConfig = {
    shoulderWidth: effective.shoulderWidth,
    waistScale: effective.waistScale,
    hipWidth: effective.hipWidth,
    chestBust: effective.chestBust,
  };

  // Build complete AvatarConfig payload
  const currentConfig: AvatarConfig = {
    modelType,
    presentation,
    bodyFrame,
    build: currentFrameObj.build,
    heightCm,
    heightScale,
    skinToneHex,
    baseWearHex: "#18181A",
    shoulderPct,
    waistPct,
    bodyMorphs: activeMorphs,
    hairStyle,
    hairColorHex,
    eyewear,
    stance,
    outfit,
  };

  // Safe preset mapping for database compatibility
  const standardPreset = mapToStandardPreset(bodyFrame, skinToneHex);

  // Emit changes to parent
  useEffect(() => {
    onChange?.({
      preset: standardPreset,
      presentation,
      skinToneHex,
      baseWearHex: "#18181A",
      heightScale,
      modelType,
      hairStyle,
      hairColorHex,
      eyewear,
      outfit,
      avatarConfig: currentConfig,
    });
  }, [
    bodyFrame,
    presentation,
    skinToneHex,
    heightScale,
    modelType,
    hairStyle,
    hairColorHex,
    eyewear,
    outfit,
    shoulderPct,
    waistPct,
  ]);

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
    setWaistPct(50);
    setSkinToneHex("#D59D7B");
    setHairStyle("wavy_curtains");
    setEyewear("none");
    setStance("runway_confident");
  };

  // Continue action
  const handleContinue = () => {
    const payload = {
      preset: standardPreset,
      presentation,
      skinToneHex,
      baseWearHex: "#18181A",
      heightScale,
      modelType,
      hairStyle,
      hairColorHex,
      eyewear,
      outfit,
      avatarConfig: currentConfig,
    };
    if (showSaveButton && onSave) {
      onSave(payload);
      return;
    }
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div
      className={cn(
        "h-full w-full select-none overflow-hidden bg-[#F8F9FA] text-neutral-900 font-sans",
        className,
      )}
    >
      {/* =========================================================================
          DESKTOP DEDICATED VIEW (hidden on mobile, visible md+) - APPLE STUDIO MINIMALISM
         ========================================================================= */}
      <div className="hidden md:flex h-full w-full max-w-[1360px] mx-auto p-4 flex-col justify-center">
        <div className="flex flex-col h-[94dvh] w-full rounded-3xl border border-black/[0.08] bg-white shadow-xl overflow-hidden">
          {/* Top Minimalist Header */}
          <div className="h-14 shrink-0 bg-white/80 backdrop-blur-md border-b border-black/[0.06] px-6 flex items-center justify-between">
            {/* Left: Section Title */}
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-neutral-900" />
              <span className="text-sm font-semibold tracking-tight text-neutral-900">
                Avatar Studio
              </span>
            </div>

            {/* Center: 3 Progress Indicator Pills */}
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-8 rounded-full transition-colors",
                    i <= currentStep ? "bg-neutral-900" : "bg-neutral-200",
                  )}
                />
              ))}
            </div>

            {/* Right: Restart & Exit Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestart}
                className="flex items-center gap-1.5 rounded-full border border-black/5 bg-neutral-100 hover:bg-neutral-200/70 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all active:scale-95"
                title="Restart Avatar Customization"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restart</span>
              </button>
              <button
                type="button"
                onClick={onExit || onBack}
                className="flex items-center gap-1.5 rounded-full border border-black/5 bg-neutral-100 hover:bg-neutral-200/70 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all active:scale-95"
                title="Exit"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Content Area */}
          <div className="flex-1 min-h-0 flex gap-6 p-6 overflow-hidden">
            {/* LEFT COLUMN: Interactive 3D Mannequin Viewport */}
            <div className="w-1/2 h-full flex flex-col relative rounded-2xl border border-black/[0.06] bg-neutral-50/60 overflow-hidden">
              <ThreeMannequinViewer
                modelType={modelType}
                build={currentFrameObj.build}
                bodyMorphs={isComparingDefault ? undefined : activeMorphs}
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
                className="w-full h-full bg-transparent"
              />

              {/* Dev A/B Comparison Pill (Bottom Left of 3D Viewport) */}
              <button
                type="button"
                onClick={() => setIsComparingDefault((v) => !v)}
                className={cn(
                  "absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full border border-black/5 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-md transition-all active:scale-95",
                  isComparingDefault
                    ? "bg-neutral-900 text-white"
                    : "bg-white/80 text-neutral-700 hover:bg-white hover:text-neutral-900",
                )}
                title="Toggle comparison between default base proportions and custom body morphs"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{isComparingDefault ? "Base Figure" : "Customized"}</span>
              </button>
            </div>

            {/* RIGHT COLUMN: Customization Studio Panel */}
            <div className="w-1/2 h-full flex flex-col justify-between overflow-hidden py-1">
              {/* Studio Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    Customize Mannequin
                  </h1>
                  <p className="mt-0.5 text-xs text-neutral-500 font-normal">
                    Adjust your avatar's proportions and style in real time.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                  <span>Live Sync</span>
                </span>
              </div>

              {/* iOS-Style Category Segmented Pills */}
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full mt-3 border border-black/[0.04]">
                {MOBILE_CATEGORIES.map((t) => {
                  const isActive = activeTab === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-medium transition-all",
                        isActive
                          ? "bg-white text-neutral-900 shadow-xs font-semibold"
                          : "text-neutral-500 hover:text-neutral-900",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Tab Customization Card */}
              <div className="flex-1 min-h-0 bg-white rounded-2xl border border-black/[0.06] p-4 flex flex-col justify-around my-3 shadow-xs overflow-hidden">
                {activeTab === "body" && (
                  <>
                    {/* 1. Body Frame */}
                    <div>
                      <span className="block text-xs font-medium text-neutral-700 mb-2">
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
                                setShoulderPct(50);
                                setWaistPct(50);
                              }}
                              className={cn(
                                "relative flex flex-col items-center justify-center rounded-2xl border p-2.5 transition-all",
                                isSelected
                                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                  : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                              )}
                            >
                              <BodySilhouetteIcon type={f.id} isSelected={isSelected} />
                              <span className="mt-1 text-[11px] font-medium">{f.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Height Slider */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1">
                        <span>Height</span>
                        <span className="font-semibold text-neutral-900 text-sm">
                          {heightCm} cm
                        </span>
                      </div>
                      <input
                        type="range"
                        min={150}
                        max={195}
                        value={heightCm}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        className="w-full accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                      />
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-0.5">
                        <span>150 cm</span>
                        <span>195 cm</span>
                      </div>
                    </div>

                    {/* 3. Skin Tone Swatches */}
                    <div>
                      <span className="block text-xs font-medium text-neutral-700 mb-2">
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
                                "relative h-8 w-8 rounded-full border border-black/10 transition-transform active:scale-90",
                                isSelected && "ring-2 ring-neutral-900 ring-offset-2 scale-105",
                              )}
                              style={{ backgroundColor: s.hex }}
                              title={s.label}
                            >
                              {isSelected && (
                                <Check className="absolute inset-0 m-auto h-3.5 w-3.5 stroke-[2.5] text-white drop-shadow-xs" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Proportions */}
                    <div className="pt-2 border-t border-black/[0.04]">
                      <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Proportions
                      </span>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-neutral-700">
                          <span className="w-28 font-medium">Shoulder Width</span>
                          <input
                            type="range"
                            min={30}
                            max={70}
                            value={shoulderPct}
                            onChange={(e) => setShoulderPct(Number(e.target.value))}
                            className="flex-1 mx-2 accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                          />
                          <span className="w-10 text-right font-semibold text-neutral-900">
                            {shoulderPct}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-neutral-700">
                          <span className="w-28 font-medium">Waist Width</span>
                          <input
                            type="range"
                            min={30}
                            max={70}
                            value={waistPct}
                            onChange={(e) => setWaistPct(Number(e.target.value))}
                            className="flex-1 mx-2 accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                          />
                          <span className="w-10 text-right font-semibold text-neutral-900">
                            {waistPct}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === "avatar" && (
                  <div className="flex flex-col justify-around h-full space-y-3">
                    <div>
                      <span className="block text-xs font-medium text-neutral-700 mb-2">
                        Digital Twin Presentation
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
                                "flex flex-col items-center justify-center rounded-2xl border p-3.5 transition-all",
                                isSelected
                                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                  : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-xs font-medium",
                                  isSelected ? "text-neutral-300" : "text-neutral-400",
                                )}
                              >
                                {t.badge}
                              </span>
                              <span className="text-sm font-semibold mt-0.5">{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "face" && (
                  <div className="flex flex-col justify-around h-full space-y-3">
                    <div>
                      <span className="block text-xs font-medium text-neutral-700 mb-2">
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
                                "rounded-xl border px-3 py-2.5 text-xs transition-all font-medium",
                                isSelected
                                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                  : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
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
                      <span className="block text-xs font-medium text-neutral-700 mb-2">
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
                                "rounded-xl border px-2.5 py-2 text-[11px] transition-all font-medium",
                                isSelected
                                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                  : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                              )}
                            >
                              {h.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-neutral-700 mb-2">
                        Hair Tint Color
                      </span>
                      <div className="flex items-center gap-2.5 flex-wrap">
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
                                "relative h-7 w-7 rounded-full border border-black/10 transition-transform active:scale-90",
                                isSelected && "ring-2 ring-neutral-900 ring-offset-2 scale-105",
                              )}
                              style={{ backgroundColor: c.hex }}
                              title={c.label}
                            >
                              {isSelected && (
                                <Check className="absolute inset-0 m-auto h-3.5 w-3.5 stroke-[2.5] text-white drop-shadow-xs" />
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
                      <span className="block text-xs font-medium text-neutral-700 mb-1.5">
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
                              "rounded-xl border py-1.5 text-xs capitalize transition-all font-medium",
                              outfit.topType === t
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-neutral-700 mb-1.5">
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
                              "rounded-xl border py-1.5 text-xs capitalize transition-all font-medium",
                              outfit.bottomType === b
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                            )}
                          >
                            {b.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                        Footwear & Eyewear
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
                              "flex-1 rounded-xl border py-1.5 text-xs capitalize transition-all font-medium",
                              outfit.shoesType === s
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                            )}
                          >
                            {s}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            pushHistory();
                            setEyewear((prev) =>
                              prev === "none" ? "designer_sunglasses" : "none",
                            );
                          }}
                          className={cn(
                            "rounded-xl border px-3 py-1.5 text-xs flex items-center gap-1 transition-all font-medium",
                            eyewear !== "none"
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                          )}
                          title={
                            modelType.includes("male")
                              ? "Glasses mesh female twin only"
                              : "Toggle eyewear"
                          }
                        >
                          <Glasses className="h-3.5 w-3.5" />
                          <span>Glasses</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Button (Apple Pill) */}
              <button
                type="button"
                onClick={handleContinue}
                className="w-full rounded-full bg-neutral-900 hover:bg-black py-3.5 text-sm font-medium text-white shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>{showSaveButton ? "Save & Apply Look" : "Continue to Outfits"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE DEDICATED VIEW (visible on mobile <md, hidden md+) - SNAPCHAT / APPLE MINIMALIST
         ========================================================================= */}
      <div className="relative flex md:hidden h-full w-full flex-col overflow-hidden bg-[#F8F9FA]">
        {/* Full-bleed 3D Mannequin Canvas (Avatar-First Viewport) */}
        <div className="absolute inset-0 z-0">
          <ThreeMannequinViewer
            modelType={modelType}
            build={currentFrameObj.build}
            bodyMorphs={isComparingDefault ? undefined : activeMorphs}
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
            showFocusTabs={false}
            hideInternalHeader={true}
            className="w-full h-full bg-transparent"
          />
        </div>

        {/* Compact Frosted Floating Top Bar */}
        <div className="relative z-30 flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
          {/* Left: Back / Exit & Reset */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {(onBack || onExit) && (
              <button
                type="button"
                onClick={onBack || onExit}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/80 text-neutral-700 shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
                aria-label="Back"
                title="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleRestart}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/80 text-neutral-700 shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
              aria-label="Reset Avatar"
              title="Reset Avatar"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Center: Digital Twin Selector (iOS Capsule Pill) */}
          <div className="pointer-events-auto flex items-center rounded-full border border-black/5 bg-white/80 p-0.5 shadow-sm backdrop-blur-md">
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
                    "rounded-full px-3 py-1 text-xs font-medium transition-all",
                    isSelected
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Right: Undo & Comparison Pill */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyRef.current.length === 0}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/80 text-neutral-700 shadow-sm backdrop-blur-md transition-all active:scale-95",
                historyRef.current.length === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-white",
              )}
              aria-label="Undo"
              title="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsComparingDefault((v) => !v)}
              className={cn(
                "flex h-9 items-center gap-1 rounded-full border border-black/5 px-2.5 text-[11px] font-medium shadow-sm backdrop-blur-md transition-all active:scale-95",
                isComparingDefault
                  ? "bg-neutral-900 text-white"
                  : "bg-white/80 text-neutral-700 hover:bg-white",
              )}
              title="Toggle A/B comparison"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{isComparingDefault ? "Base" : "Custom"}</span>
            </button>
          </div>
        </div>

        {/* Floating Camera Focus Controls */}
        <div className="absolute top-[58px] left-3 z-20 pointer-events-auto">
          <div className="flex items-center gap-0.5 rounded-full border border-black/5 bg-white/80 p-0.5 shadow-sm backdrop-blur-md">
            {(["full", "face", "torso", "shoes"] as const).map((f) => {
              const isCurrent = cameraFocus === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCameraFocus(f)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize transition-all",
                    isCurrent
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-black/5",
                  )}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsed Expand-Pill Affordance (Snapchat Bitmoji Style) */}
        {!isMobileSheetOpen && (
          <div className="absolute bottom-[66px] inset-x-0 z-20 flex justify-center pointer-events-none">
            <button
              type="button"
              onClick={() => setIsMobileSheetOpen(true)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-neutral-900/90 text-white px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-md transition-all active:scale-95 hover:bg-black"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Customize {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            </button>
          </div>
        )}

        {/* Collapsible Customization Sheet (Apple iOS Style) */}
        {isMobileSheetOpen && (
          <div
            className="absolute bottom-[64px] inset-x-2.5 z-20 max-h-[48vh] flex flex-col rounded-[28px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out pointer-events-auto"
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Grab / Drag Bar Handle */}
            <div className="w-9 h-1 rounded-full bg-neutral-300 mx-auto my-2 shrink-0" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between px-4 pb-2 border-b border-black/[0.04] shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {activeTab}
              </span>
              <button
                type="button"
                onClick={() => setIsMobileSheetOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 transition-colors"
                title="Collapse controls"
                aria-label="Collapse controls"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Scrollable Sheet Content */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 overscroll-contain">
              {/* TAB: BODY */}
              {activeTab === "body" && (
                <>
                  {/* Body Frame Presets */}
                  <div>
                    <span className="block text-xs font-medium text-neutral-700 mb-1.5">
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
                              setShoulderPct(50);
                              setWaistPct(50);
                            }}
                            className={cn(
                              "relative flex flex-col items-center justify-center rounded-2xl py-2 px-1 transition-all border",
                              isSelected
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                            )}
                          >
                            <BodySilhouetteIcon type={f.id} isSelected={isSelected} small />
                            <span className="text-[10px] mt-1 font-medium">{f.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Height Slider */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1">
                      <span>Height</span>
                      <span className="font-semibold text-neutral-900">{heightCm} cm</span>
                    </div>
                    <input
                      type="range"
                      min={150}
                      max={195}
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                    />
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-0.5">
                      <span>150 cm</span>
                      <span>195 cm</span>
                    </div>
                  </div>

                  {/* Skin Tone Swatches */}
                  <div>
                    <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                      Skin Tone
                    </span>
                    <div className="flex items-center justify-between px-1">
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
                              "relative h-7 w-7 rounded-full border border-black/10 transition-transform active:scale-95",
                              isSelected && "ring-2 ring-neutral-900 ring-offset-2 scale-105",
                            )}
                            style={{ backgroundColor: s.hex }}
                            title={s.label}
                          >
                            {isSelected && (
                              <Check className="absolute inset-0 m-auto h-3 w-3 stroke-[2.5] text-white drop-shadow-xs" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Proportions Sliders */}
                  <div className="space-y-2.5 pt-2 border-t border-black/[0.04]">
                    <span className="block text-xs font-medium text-neutral-700">Proportions</span>
                    <div className="flex items-center justify-between text-xs text-neutral-700">
                      <span className="w-20 font-medium">Shoulder</span>
                      <input
                        type="range"
                        min={30}
                        max={70}
                        value={shoulderPct}
                        onChange={(e) => setShoulderPct(Number(e.target.value))}
                        className="flex-1 mx-2 accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                      />
                      <span className="w-8 text-right font-semibold text-neutral-900">
                        {shoulderPct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-700">
                      <span className="w-20 font-medium">Waist</span>
                      <input
                        type="range"
                        min={30}
                        max={70}
                        value={waistPct}
                        onChange={(e) => setWaistPct(Number(e.target.value))}
                        className="flex-1 mx-2 accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                      />
                      <span className="w-8 text-right font-semibold text-neutral-900">
                        {waistPct}%
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* TAB: AVATAR */}
              {activeTab === "avatar" && (
                <div className="space-y-3">
                  <div>
                    <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                      Model Presentation
                    </span>
                    <div className="grid grid-cols-2 gap-2">
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
                              "rounded-2xl border p-3 text-xs transition-all flex flex-col items-center",
                              isSelected
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                            )}
                          >
                            <span
                              className={cn(
                                "text-[10px] font-medium",
                                isSelected ? "text-neutral-300" : "text-neutral-400",
                              )}
                            >
                              {t.badge}
                            </span>
                            <span className="text-xs font-semibold mt-0.5">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                      Runway Pose
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
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
                              "rounded-xl border px-3 py-2 text-xs transition-all font-medium",
                              isSelected
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
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

              {/* TAB: FACE / POSTURE */}
              {activeTab === "face" && (
                <div className="space-y-2">
                  <span className="block text-xs font-medium text-neutral-700">
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
                            "rounded-xl border px-3 py-2.5 text-xs transition-all font-medium",
                            isSelected
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                          )}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: HAIR */}
              {activeTab === "hair" && (
                <div className="space-y-3">
                  <div>
                    <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                      Hairstyle
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
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
                              "rounded-xl border py-2 text-[10px] transition-all font-medium",
                              isSelected
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                            )}
                          >
                            {h.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-medium text-neutral-700 mb-1.5">
                      Hair Tint Color
                    </span>
                    <div className="flex items-center justify-between px-1">
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
                              "relative h-7 w-7 rounded-full border border-black/10 transition-transform active:scale-95",
                              isSelected && "ring-2 ring-neutral-900 ring-offset-2 scale-105",
                            )}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                          >
                            {isSelected && (
                              <Check className="absolute inset-0 m-auto h-3 w-3 stroke-[2.5] text-white drop-shadow-xs" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: OUTFIT */}
              {activeTab === "outfit" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="block text-xs font-medium text-neutral-700">Top Garment</span>
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
                            "rounded-xl border py-1.5 text-xs capitalize transition-all font-medium",
                            outfit.topType === t
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-xs font-medium text-neutral-700">
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
                            "rounded-xl border py-1.5 text-[11px] capitalize transition-all font-medium",
                            outfit.bottomType === b
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                          )}
                        >
                          {b.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-xs font-medium text-neutral-700">
                      Footwear & Eyewear
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(["sneakers", "loafers", "none"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            pushHistory();
                            setOutfit((prev) => ({ ...prev, shoesType: s }));
                          }}
                          className={cn(
                            "flex-1 rounded-xl border py-1.5 text-xs capitalize transition-all font-medium",
                            outfit.shoesType === s
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
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
                          "rounded-xl border px-3 py-1.5 text-xs flex items-center gap-1 transition-all font-medium",
                          eyewear !== "none"
                            ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                            : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                        )}
                        title={
                          modelType.includes("male")
                            ? "Glasses mesh female twin only"
                            : "Toggle eyewear"
                        }
                      >
                        <Glasses className="h-3.5 w-3.5" />
                        <span>Glasses</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sheet Footer Action: Next/Continue (Apple Pill) */}
            <div className="border-t border-black/[0.04] p-3 bg-white/80 shrink-0">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full rounded-full bg-neutral-900 hover:bg-black py-3 text-xs font-medium text-white shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>{showSaveButton ? "Save & Apply Look" : "Continue to Outfits"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Category Navigation Bar (Apple / Snapchat Style) */}
        <div className="absolute bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-black/[0.06] bg-white/80 backdrop-blur-xl px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-sm">
          {MOBILE_CATEGORIES.map((t) => {
            const isActive = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (activeTab === t.id) {
                    setIsMobileSheetOpen((prev) => !prev);
                  } else {
                    setActiveTab(t.id);
                    setIsMobileSheetOpen(true);
                  }
                }}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center rounded-xl py-1 px-1 transition-all",
                  isActive
                    ? "text-neutral-900 font-semibold"
                    : "text-neutral-400 hover:text-neutral-700 font-medium",
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isActive
                      ? "bg-neutral-900 text-white shadow-xs"
                      : "bg-transparent text-current",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] mt-0.5">{t.label}</span>
              </button>
            );
          })}
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
  const size = small ? "h-6 w-5" : "h-8 w-6";

  return (
    <svg
      className={cn(
        size,
        "transition-transform",
        isSelected ? "text-current scale-105" : "text-neutral-700",
      )}
      viewBox="0 0 24 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="5" r="3.2" fill={isSelected ? "currentColor" : "none"} />

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
