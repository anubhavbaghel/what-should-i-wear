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
  FacialExpressionType,
  BodyMorphConfig,
} from "./ThreeMannequinViewer";
import { AvatarConfig, BodyFrameType, mapToStandardPreset } from "@/lib/avatar.types";
import { calculateEffectiveMultipliers } from "@/lib/avatar-transform";
import { cn } from "@/lib/utils";
import {
  Check,
  User,
  Smile,
  Sparkles,
  Shirt,
  RotateCcw,
  LogOut,
  ArrowRight,
  Glasses,
  Eye,
  ChevronDown,
  ChevronUp,
  Undo2,
  Redo2,
  ArrowLeft,
  Sliders,
  Camera,
  MoreHorizontal,
} from "lucide-react";

export type StudioTab = "avatar" | "body" | "face" | "hair" | "outfit";
export type MobileSheetState = "collapsed" | "expanded";
export type { BodyFrameType, FacialExpressionType };

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

export const FACIAL_EXPRESSIONS: {
  id: FacialExpressionType;
  label: string;
  description: string;
}[] = [
  { id: "neutral", label: "Natural Rest", description: "Calm editorial rest" },
  { id: "smile", label: "Soft Smile", description: "Warm & approachable" },
  { id: "confident", label: "Runway Smirk", description: "Confident runway attitude" },
  { id: "editorial", label: "Editorial Chic", description: "Focused fashion gaze" },
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
  { id: "wavy_curtains", label: "Natural Volume" },
  { id: "none", label: "Minimal / Bare" },
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
    shortLabel: "Female Twin",
    label: "Female Stylized Twin",
    badge: "Womenswear",
    presentation: "feminine" as StylePresentationType,
  },
  {
    id: "/models/male-twin.glb",
    shortLabel: "Male Twin",
    label: "Male Stylized Twin",
    badge: "Menswear",
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
  facialExpression: FacialExpressionType;
  outfit: MannequinOutfitConfig;
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

  // Mobile three-state bottom sheet: "collapsed" | "compact" | "expanded"
  const [mobileSheetState, setMobileSheetState] = useState<MobileSheetState>("collapsed");

  // Floating Contextual Menus
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isCameraMenuOpen, setIsCameraMenuOpen] = useState(false);

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
  const [facialExpression, setFacialExpression] = useState<FacialExpressionType>(
    initialConfig?.facialExpression || "neutral",
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

  // Undo & Redo History Stacks
  const historyRef = useRef<StudioHistoryState[]>([]);
  const redoRef = useRef<StudioHistoryState[]>([]);
  const [, setHistoryVersion] = useState(0);

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
      facialExpression,
      outfit: { ...outfit },
    };
    historyRef.current.push(current);
    if (historyRef.current.length > 25) historyRef.current.shift();
    redoRef.current = [];
    setHistoryVersion((v) => v + 1);
  };

  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
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
      facialExpression,
      outfit: { ...outfit },
    };
    redoRef.current.push(current);
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
    setFacialExpression(prev.facialExpression || "neutral");
    setOutfit(prev.outfit);
    setHistoryVersion((v) => v + 1);
  };

  const handleRedo = () => {
    if (redoRef.current.length === 0) return;
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
      facialExpression,
      outfit: { ...outfit },
    };
    historyRef.current.push(current);
    const next = redoRef.current.pop()!;
    setModelType(next.modelType);
    setSkinToneHex(next.skinToneHex);
    setBodyFrame(next.bodyFrame);
    setHeightCm(next.heightCm);
    setShoulderPct(next.shoulderPct);
    setWaistPct(next.waistPct);
    setHairStyle(next.hairStyle);
    setHairColorHex(next.hairColorHex);
    setEyewear(next.eyewear);
    setStance(next.stance);
    setFacialExpression(next.facialExpression || "neutral");
    setOutfit(next.outfit);
    setHistoryVersion((v) => v + 1);
  };

  const handleResetDefaults = () => {
    pushHistory();
    setBodyFrame("athletic");
    setHeightCm(165);
    setShoulderPct(50);
    setWaistPct(50);
    setSkinToneHex("#D59D7B");
    setHairStyle("wavy_curtains");
    setHairColorHex("#18181A");
    setEyewear("none");
    setStance("runway_confident");
    setFacialExpression("neutral");
    setOutfit({
      topType: "tee",
      topColor: "#222226",
      bottomType: "trousers",
      bottomColor: "#18181A",
      shoesType: "sneakers",
      shoesColor: "#6B3A5B",
    });
    setIsActionsMenuOpen(false);
  };

  const canUndo = historyRef.current.length > 0;
  const canRedo = redoRef.current.length > 0;

  // Touch Drag Gestures on Bottom Sheet Handle
  const touchStartYRef = useRef<number | null>(null);

  const handleDragTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleDragTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartYRef.current = null;

    if (deltaY < -25) {
      // Swipe Up -> Expand
      setMobileSheetState("expanded");
    } else if (deltaY > 25) {
      // Swipe Down -> Collapse
      setMobileSheetState("collapsed");
    }
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
    facialExpression,
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
    facialExpression,
  ]);

  // Restart / Reset action for desktop
  const handleRestart = () => {
    if (onRestart) {
      onRestart();
      return;
    }
    handleResetDefaults();
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

  // Category selection handler: toggles expanded/collapsed and sets active tab
  const handleCategorySelect = (catId: StudioTab) => {
    if (activeTab === catId) {
      // Tap active category: toggle between collapsed and expanded
      setMobileSheetState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
    } else {
      setActiveTab(catId);
      setMobileSheetState("expanded");

      // Contextual smooth camera focus
      if (catId === "hair" || catId === "face") {
        setCameraFocus("face");
      } else if (catId === "body") {
        setCameraFocus("torso");
      } else if (catId === "avatar" || catId === "outfit") {
        setCameraFocus("full");
      }
    }
  };

  // Close all floating popovers on outside click
  const closeAllMenus = () => {
    setIsModelMenuOpen(false);
    setIsActionsMenuOpen(false);
    setIsCameraMenuOpen(false);
  };

  const isAnyMenuOpen = isModelMenuOpen || isActionsMenuOpen || isCameraMenuOpen;

  // Dynamic Camera vertical offset so avatar is framed in visible viewport above sheet
  const dynamicCameraOffsetY = mobileSheetState === "expanded" ? -0.42 : 0;

  return (
    <div
      className={cn(
        "h-full w-full select-none overflow-hidden bg-[#F7F6F3] text-neutral-900 font-sans",
        className,
      )}
    >
      {/* =========================================================================
          DESKTOP DEDICATED VIEW (hidden on mobile, visible md+) - APPLE STUDIO
         ========================================================================= */}
      <div className="hidden md:flex h-full w-full max-w-[1360px] mx-auto p-4 flex-col justify-center">
        <div className="flex flex-col h-[94dvh] w-full rounded-3xl border border-black/[0.08] bg-white shadow-xl overflow-hidden">
          {/* Top Minimalist Header */}
          <div className="h-14 shrink-0 bg-white/80 backdrop-blur-md border-b border-black/[0.06] px-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-neutral-900" />
              <span className="text-sm font-semibold tracking-tight text-neutral-900">
                Avatar Studio
              </span>
            </div>

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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 rounded-full border border-black/5 bg-neutral-100 hover:bg-neutral-200/70 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-all active:scale-95"
                title="Reset to Baseline Defaults"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
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
            {/* LEFT COLUMN: 3D Mannequin Viewport */}
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
                facialExpression={facialExpression}
                outfit={outfit}
                cameraFocus={cameraFocus}
                onFocusChange={setCameraFocus}
                onUndo={canUndo ? handleUndo : undefined}
                showFocusTabs={true}
                className="w-full h-full bg-transparent"
              />

              <button
                type="button"
                onClick={() => setIsComparingDefault((v) => !v)}
                className={cn(
                  "absolute bottom-3 left-3 z-20 flex items-center gap-1.5 rounded-full border border-black/5 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-md transition-all active:scale-95",
                  isComparingDefault
                    ? "bg-neutral-900 text-white"
                    : "bg-white/80 text-neutral-700 hover:bg-white hover:text-neutral-900",
                )}
                title="Toggle comparison with base defaults"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{isComparingDefault ? "Base Figure" : "Customized"}</span>
              </button>
            </div>

            {/* RIGHT COLUMN: Customization Studio Panel */}
            <div className="w-1/2 h-full flex flex-col justify-between overflow-hidden py-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                    Customize Mannequin
                  </h1>
                  <p className="mt-0.5 text-xs text-neutral-500 font-normal">
                    Adjust proportions, posture, and wardrobe in real time.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                  <span>Live Sync</span>
                </span>
              </div>

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

              <div className="flex-1 min-h-0 bg-white rounded-2xl border border-black/[0.06] p-4 flex flex-col justify-around my-3 shadow-xs overflow-hidden">
                {activeTab === "avatar" && (
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
                                "rounded-xl border px-3 py-2.5 text-xs transition-all font-medium text-left",
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

                {activeTab === "body" && (
                  <>
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
                        onPointerDown={() => {
                          pushHistory();
                          if (isComparingDefault) setIsComparingDefault(false);
                        }}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        style={{ touchAction: "none" }}
                        className="w-full accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                      />
                    </div>

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
                            onPointerDown={() => {
                              pushHistory();
                              if (isComparingDefault) setIsComparingDefault(false);
                            }}
                            onChange={(e) => setShoulderPct(Number(e.target.value))}
                            style={{ touchAction: "none" }}
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
                            onPointerDown={() => {
                              pushHistory();
                              if (isComparingDefault) setIsComparingDefault(false);
                            }}
                            onChange={(e) => setWaistPct(Number(e.target.value))}
                            style={{ touchAction: "none" }}
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

                {activeTab === "face" && (
                  <div className="flex flex-col justify-around h-full space-y-3">
                    <div>
                      <span className="block text-xs font-medium text-neutral-700 mb-2">
                        Facial Expression & Vibe
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        {FACIAL_EXPRESSIONS.map((expr) => {
                          const isSelected = facialExpression === expr.id;
                          return (
                            <button
                              key={expr.id}
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setFacialExpression(expr.id);
                              }}
                              className={cn(
                                "rounded-2xl border p-3 transition-all flex flex-col items-start text-left",
                                isSelected
                                  ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                  : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                              )}
                            >
                              <span className="text-xs font-semibold">{expr.label}</span>
                              <span
                                className={cn(
                                  "text-[10px] mt-0.5",
                                  isSelected ? "text-neutral-300" : "text-neutral-400",
                                )}
                              >
                                {expr.description}
                              </span>
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
                        Hairstyle
                      </span>
                      <div className="grid grid-cols-2 gap-2">
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
                                "rounded-xl border px-3 py-2 text-xs transition-all font-medium text-left",
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
                          disabled={modelType.includes("male")}
                          onClick={() => {
                            pushHistory();
                            setEyewear((prev) =>
                              prev === "none" ? "designer_sunglasses" : "none",
                            );
                          }}
                          className={cn(
                            "rounded-xl border px-3 py-1.5 text-xs flex items-center gap-1 transition-all font-medium",
                            modelType.includes("male")
                              ? "opacity-40 cursor-not-allowed bg-neutral-50 border-black/[0.04] text-neutral-400"
                              : eyewear !== "none"
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-sm"
                                : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                          )}
                          title={
                            modelType.includes("male")
                              ? "Eyewear female twin only"
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
          MOBILE DEDICATED VIEW (visible on mobile < md) - RESPONSIVE AVATAR COMPOSITION
         ========================================================================= */}
      <div className="relative md:hidden h-full w-full overflow-hidden bg-[#FAF8F5]">
        {/* Layer B: 3D Avatar Viewport (Full-Screen Responsive Focus) */}
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
            facialExpression={facialExpression}
            outfit={outfit}
            cameraFocus={cameraFocus}
            sheetState={mobileSheetState}
            onFocusChange={setCameraFocus}
            showFocusTabs={false}
            hideInternalHeader={true}
            className="w-full h-full bg-transparent"
          />
        </div>

        {/* Global Backdrop for Open Dropdowns */}
        {isAnyMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xs transition-opacity"
            onClick={closeAllMenus}
            onTouchStart={closeAllMenus}
          />
        )}

        {/* Layer A: Top Utility Bar (Persistent, Unified Single Row) */}
        <div className="relative z-50 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] pb-2 pointer-events-none">
          {/* Left: Back / Exit */}
          <div className="pointer-events-auto flex items-center">
            {(onBack || onExit) && (
              <button
                type="button"
                onClick={onBack || onExit}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/85 text-neutral-700 shadow-xs backdrop-blur-md transition-all hover:bg-white active:scale-95"
                aria-label="Back"
                title="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right: Camera Focus, Undo, Redo, and More Actions Menu */}
          <div className="pointer-events-auto flex items-center gap-1 relative">
            {/* Compact Contextual Camera Focus Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsCameraMenuOpen((prev) => !prev);
                  setIsModelMenuOpen(false);
                  setIsActionsMenuOpen(false);
                }}
                className={cn(
                  "flex h-9 items-center gap-1 rounded-full border border-black/5 bg-white/85 px-2.5 text-xs font-medium text-neutral-700 shadow-xs backdrop-blur-md transition-all active:scale-95 hover:bg-white",
                  isCameraMenuOpen && "bg-neutral-100",
                )}
                aria-label="Camera Focus"
                title="Camera Focus"
              >
                <Camera className="h-3.5 w-3.5 text-neutral-500" />
                <span className="capitalize text-[11px] hidden sm:inline">{cameraFocus}</span>
              </button>

              {isCameraMenuOpen && (
                <div className="absolute top-11 right-0 w-32 rounded-2xl border border-black/[0.08] bg-white/95 p-1 shadow-xl backdrop-blur-2xl transition-all z-50 space-y-0.5">
                  {(["full", "face", "torso", "shoes"] as const).map((f) => {
                    const isCurrent = cameraFocus === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setCameraFocus(f);
                          setIsCameraMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs capitalize font-medium transition-all text-left",
                          isCurrent
                            ? "bg-neutral-900 text-white font-semibold shadow-xs"
                            : "text-neutral-700 hover:bg-neutral-100",
                        )}
                      >
                        <span>{f}</span>
                        {isCurrent && <Check className="h-3 w-3 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/85 text-neutral-700 shadow-xs backdrop-blur-md transition-all active:scale-95",
                !canUndo ? "opacity-30 cursor-not-allowed" : "hover:bg-white",
              )}
              aria-label="Undo"
              title="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/85 text-neutral-700 shadow-xs backdrop-blur-md transition-all active:scale-95",
                !canRedo ? "opacity-30 cursor-not-allowed" : "hover:bg-white",
              )}
              aria-label="Redo"
              title="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>

            {/* Secondary Actions (Reset & A/B) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsActionsMenuOpen((prev) => !prev);
                  setIsModelMenuOpen(false);
                  setIsCameraMenuOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/85 text-neutral-700 shadow-xs backdrop-blur-md transition-all hover:bg-white active:scale-95"
                aria-label="More actions"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {isActionsMenuOpen && (
                <div className="absolute top-11 right-0 w-48 rounded-2xl border border-black/[0.08] bg-white/95 p-1.5 shadow-xl backdrop-blur-2xl transition-all z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Digital Twin Model
                  </div>
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
                          setIsActionsMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all text-left",
                          isSelected
                            ? "bg-neutral-900 text-white font-semibold shadow-xs"
                            : "text-neutral-700 hover:bg-neutral-100",
                        )}
                      >
                        <div className="flex flex-col">
                          <span>{t.shortLabel}</span>
                          <span
                            className={cn(
                              "text-[10px]",
                              isSelected ? "text-neutral-300" : "text-neutral-400",
                            )}
                          >
                            {t.badge}
                          </span>
                        </div>
                        {isSelected && <Check className="h-3 w-3 stroke-[2.5]" />}
                      </button>
                    );
                  })}

                  <div className="h-px bg-neutral-100 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsComparingDefault((v) => !v);
                      setIsActionsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="h-3.5 w-3.5" />
                      <span>A/B Compare</span>
                    </div>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                        isComparingDefault
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600",
                      )}
                    >
                      {isComparingDefault ? "Base" : "Custom"}
                    </span>
                  </button>

                  <div className="h-px bg-neutral-100" />

                  <button
                    type="button"
                    onClick={() => {
                      handleResetDefaults();
                      setIsActionsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-all text-left"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            LAYER C & D: UNIFIED BOTTOM CUSTOMIZATION PANEL
            Navigation is at the TOP of the customization panel.
            Two States:
              - COLLAPSED: Model takes full view height. Only top navigation bar rests at screen bottom.
              - EXPANDED (46vh): Customization panel expands, scrollable controls below navigation,
                                 and 3D model scales down so its FULL HEIGHT is visible above.
           ========================================================================= */}
        <div className="fixed bottom-0 inset-x-0 z-40 flex flex-col items-center pointer-events-none">
          <div
            className={cn(
              "w-full max-w-lg rounded-t-[28px] border-t border-x border-black/[0.08] bg-white/95 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.08)] overflow-hidden transition-all duration-300 ease-in-out pointer-events-auto flex flex-col",
              mobileSheetState === "collapsed" &&
                "max-h-[72px] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))]",
              mobileSheetState === "expanded" &&
                "h-[46vh] max-h-[48vh] min-h-[340px] pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))]",
            )}
            onTouchStart={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Top Drag Handle Bar */}
            <div
              className="w-full pt-2 pb-1.5 flex justify-center cursor-pointer select-none active:opacity-60 transition-opacity shrink-0"
              onTouchStart={handleDragTouchStart}
              onTouchEnd={handleDragTouchEnd}
              onClick={() => {
                setMobileSheetState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
              }}
              title={
                mobileSheetState === "collapsed" ? "Tap to expand customization" : "Tap to collapse"
              }
            >
              <div className="w-10 h-1 rounded-full bg-neutral-300/80" />
            </div>

            {/* Navigation Panel (AT THE TOP OF THE CUSTOMIZATION PANEL) */}
            <div className="w-full px-3 pb-2 pt-0.5 border-b border-black/[0.04] flex items-center justify-between shrink-0">
              <div className="flex-1 flex items-center justify-between gap-1">
                {MOBILE_CATEGORIES.map((t) => {
                  const isActive = activeTab === t.id && mobileSheetState === "expanded";
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleCategorySelect(t.id)}
                      className={cn(
                        "flex flex-1 flex-col items-center justify-center rounded-xl py-1 px-1 transition-all",
                        isActive
                          ? "text-neutral-900 font-semibold"
                          : "text-neutral-400 hover:text-neutral-700 font-medium",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                          isActive
                            ? "bg-neutral-900 text-white shadow-xs"
                            : "bg-transparent text-current",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] mt-0.5 leading-none">{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Collapse / Expand Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setMobileSheetState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
                }}
                className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-600 transition-colors shrink-0"
                title={mobileSheetState === "expanded" ? "Collapse panel" : "Expand panel"}
                aria-label="Toggle panel"
              >
                {mobileSheetState === "expanded" ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronUp className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Scrollable Customization Content Area (Visible when expanded) */}
            <div
              className={cn(
                "w-full flex-1 overflow-y-auto px-4 py-3 space-y-3.5 overscroll-contain transition-opacity duration-200 pb-8",
                mobileSheetState === "collapsed" && "hidden opacity-0 pointer-events-none",
                mobileSheetState === "expanded" && "block opacity-100",
              )}
            >
              {/* 1. TAB: AVATAR (Runway Stances) */}
              {activeTab === "avatar" && (
                <div className="space-y-2">
                  <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Runway Posture
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
                            "rounded-xl border px-3 py-2 text-xs transition-all font-medium text-left",
                            isSelected
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
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

              {/* 2. TAB: BODY (Frame, Height, Skin, Proportions) */}
              {activeTab === "body" && (
                <>
                  {/* Sleek, Low-Profile Body Frame Selector */}
                  <div>
                    <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
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
                              "flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 transition-all border text-xs font-medium",
                              isSelected
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                                : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                            )}
                          >
                            <BodySilhouetteIcon type={f.id} isSelected={isSelected} small />
                            <span className="text-[11px] capitalize">{f.label}</span>
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
                      onPointerDown={() => {
                        pushHistory();
                        if (isComparingDefault) setIsComparingDefault(false);
                      }}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      style={{ touchAction: "none" }}
                      className="w-full accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                    />
                  </div>

                  {/* Skin Tone Swatches */}
                  <div>
                    <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
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
                  <div className="space-y-2 pt-2 border-t border-black/[0.04]">
                    <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                      Proportions
                    </span>
                    <div className="flex items-center justify-between text-xs text-neutral-700">
                      <span className="w-16 font-medium">Shoulder</span>
                      <input
                        type="range"
                        min={30}
                        max={70}
                        value={shoulderPct}
                        onPointerDown={() => {
                          pushHistory();
                          if (isComparingDefault) setIsComparingDefault(false);
                        }}
                        onChange={(e) => setShoulderPct(Number(e.target.value))}
                        style={{ touchAction: "none" }}
                        className="flex-1 mx-2 accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                      />
                      <span className="w-8 text-right font-semibold text-neutral-900">
                        {shoulderPct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-700">
                      <span className="w-16 font-medium">Waist</span>
                      <input
                        type="range"
                        min={30}
                        max={70}
                        value={waistPct}
                        onPointerDown={() => {
                          pushHistory();
                          if (isComparingDefault) setIsComparingDefault(false);
                        }}
                        onChange={(e) => setWaistPct(Number(e.target.value))}
                        style={{ touchAction: "none" }}
                        className="flex-1 mx-2 accent-neutral-900 h-1.5 rounded-full cursor-pointer bg-neutral-200"
                      />
                      <span className="w-8 text-right font-semibold text-neutral-900">
                        {waistPct}%
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* 3. TAB: FACE (ARKit Blendshape Expressions) */}
              {activeTab === "face" && (
                <div className="space-y-2">
                  <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Facial Vibe & Expression
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {FACIAL_EXPRESSIONS.map((expr) => {
                      const isSelected = facialExpression === expr.id;
                      return (
                        <button
                          key={expr.id}
                          type="button"
                          onClick={() => {
                            pushHistory();
                            setFacialExpression(expr.id);
                          }}
                          className={cn(
                            "rounded-xl border p-2.5 transition-all flex flex-col items-start text-left",
                            isSelected
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                          )}
                        >
                          <span className="text-xs font-semibold">{expr.label}</span>
                          <span
                            className={cn(
                              "text-[10px] mt-0.5",
                              isSelected ? "text-neutral-300" : "text-neutral-400",
                            )}
                          >
                            {expr.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. TAB: HAIR (Hairstyles & Tint Colors) */}
              {activeTab === "hair" && (
                <div className="space-y-3">
                  <div>
                    <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                      Hairstyle
                    </span>
                    <div className="grid grid-cols-2 gap-2">
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
                              "rounded-xl border py-2 px-3 text-xs transition-all font-medium text-left",
                              isSelected
                                ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
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
                    <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
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

              {/* 5. TAB: OUTFIT (Tops, Bottoms, Footwear, Eyewear) */}
              {activeTab === "outfit" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
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
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
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
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                          )}
                        >
                          {b.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                      Footwear & Accessories
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
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={modelType.includes("male")}
                        onClick={() => {
                          pushHistory();
                          setEyewear((prev) => (prev === "none" ? "designer_sunglasses" : "none"));
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-xs flex items-center gap-1 transition-all font-medium",
                          modelType.includes("male")
                            ? "opacity-40 cursor-not-allowed bg-neutral-50 border-black/[0.04] text-neutral-400"
                            : eyewear !== "none"
                              ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                              : "bg-neutral-50/80 hover:bg-neutral-100 border-black/[0.04] text-neutral-700",
                        )}
                        title={
                          modelType.includes("male") ? "Eyewear female twin only" : "Toggle eyewear"
                        }
                      >
                        <Glasses className="h-3.5 w-3.5" />
                        <span>{modelType.includes("male") ? "Glasses (Female)" : "Glasses"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
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
