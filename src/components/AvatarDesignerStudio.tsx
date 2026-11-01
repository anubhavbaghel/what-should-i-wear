import React, { useState, useEffect } from "react";
import {
  ThreeMannequinViewer,
  BuildType,
  StylePresentationType,
  MannequinOutfitConfig,
  ModelPresetType,
  HairstyleType,
  EyewearType,
  TopGarmentType,
  BottomGarmentType,
  ShoesGarmentType,
  CameraFocusTarget,
  FashionStanceType,
} from "./ThreeMannequinViewer";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Check,
  Shirt,
  Box,
  Glasses,
  RotateCw,
  User,
  Scissors,
  Palette,
  Layers,
  Footprints,
  Wand2,
} from "lucide-react";

export type CustomizerCategory =
  | "outfits"
  | "tops"
  | "bottoms"
  | "shoes"
  | "hair"
  | "hair_color"
  | "glasses"
  | "skin"
  | "figure"
  | "model";

export interface AvatarDesignerStudioProps {
  initialPreset?: string; // e.g. "neutral_medium", "slim_light", "curvy_dark"
  initialPresentation?: StylePresentationType;
  initialOutfit?: MannequinOutfitConfig;
  initialModelType?: ModelPresetType;
  initialHairStyle?: HairstyleType;
  initialHairColorHex?: string;
  initialEyewear?: EyewearType;
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

export const MANNEQUIN_MODELS: {
  id: ModelPresetType;
  name: string;
  badge: string;
  desc: string;
}[] = [
  {
    id: "procedural",
    name: "Stylized Modular Twin",
    badge: "✦ Full Wardrobe Ready",
    desc: "Personal styling mannequin with modular swappable garments & hair",
  },
  {
    id: "michelle",
    name: "Female Runway Twin",
    badge: "Stylized GLB",
    desc: "Sleek female runway model with customizable hair & skin tones",
  },
  {
    id: "base",
    name: "Male Athletic Twin",
    badge: "Stylized GLB",
    desc: "Athletic male humanoid with customizable hair & skin tones",
  },
  {
    id: "xbot",
    name: "Mixamo X-Bot",
    badge: "3D Joint Robot",
    desc: "Editorial humanoid mannequin with joint accents",
  },
];

export const HAIRSTYLES: { id: HairstyleType; label: string; desc: string }[] = [
  { id: "wavy_curtains", label: "Wavy Curtains", desc: "90s / Gen-Z relaxed parted flow" },
  { id: "fade", label: "Textured Fade", desc: "Clean taper with textured crop top" },
  { id: "sleek_bob", label: "Editorial Bob", desc: "Chic jaw-length straight bob" },
  { id: "high_ponytail", label: "High Ponytail", desc: "Sleek pulled-back runway look" },
  { id: "afro_curls", label: "Afro Curls", desc: "Voluminous textured crown" },
  { id: "chic_beanie", label: "Streetwear Beanie", desc: "Ribbed knit slouchy beanie" },
  { id: "none", label: "No Hair", desc: "Clean buzz / minimal profile" },
];

export const HAIR_COLORS = [
  { id: "jet_black", label: "Jet Black", hex: "#18181A" },
  { id: "espresso", label: "Dark Espresso", hex: "#3B281C" },
  { id: "chestnut", label: "Chestnut Brown", hex: "#63432B" },
  { id: "honey_blonde", label: "Honey Blonde", hex: "#C79C64" },
  { id: "copper_auburn", label: "Auburn Copper", hex: "#8A3824" },
  { id: "platinum_ash", label: "Platinum Ash", hex: "#D6D1CA" },
  { id: "pastel_lilac", label: "Pastel Lilac", hex: "#8D80AD" },
];

export const EYEWEAR_OPTIONS: { id: EyewearType; label: string; desc: string }[] = [
  { id: "none", label: "No Glasses", desc: "Natural unadorned eyes" },
  { id: "designer_sunglasses", label: "✦ Acetate Sunglasses", desc: "Thick black luxury frames" },
];

export const TOP_COLORS = [
  { hex: "#1B1B1D", label: "Jet Black" },
  { hex: "#F4F0E8", label: "Studio White" },
  { hex: "#D8CEBE", label: "Sandstone Oat" },
  { hex: "#4B5344", label: "Sage Olive" },
  { hex: "#B58C63", label: "Camel Tan" },
  { hex: "#203046", label: "Selvedge Navy" },
  { hex: "#A35D43", label: "Terracotta" },
  { hex: "#1C3F73", label: "Royal Cobalt" },
];

export const BOTTOM_COLORS = [
  { hex: "#1E1E22", label: "Slate Charcoal" },
  { hex: "#EFECE6", label: "Pure Ecru" },
  { hex: "#383E38", label: "Olive Chino" },
  { hex: "#24334A", label: "Washed Indigo" },
  { hex: "#8C7D6B", label: "Classic Khaki" },
  { hex: "#2D231E", label: "Dark Espresso" },
];

export const SHOES_COLORS = [
  { hex: "#FFFFFF", label: "Crisp White" },
  { hex: "#18181A", label: "Onyx Black" },
  { hex: "#C4B49F", label: "Sand Suede" },
  { hex: "#4A2E1B", label: "Cognac Leather" },
  { hex: "#9E2A2B", label: "Crimson Accent" },
];

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
      topColor: "#1B1B1D",
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
      shoesColor: "#18181A",
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
      shoesColor: "#4A2E1B",
    },
  },
  {
    id: "summer_studio",
    name: "White Tee & Tailored Shorts",
    vibe: "Summer Studio",
    outfit: {
      topType: "tee",
      topColor: "#F4F0E8",
      bottomType: "shorts",
      bottomColor: "#8C7D6B",
      shoesType: "sneakers",
      shoesColor: "#FFFFFF",
    },
  },
];

export const BUILDS: { id: BuildType; label: string; desc: string }[] = [
  { id: "slim", label: "Slim / Petite", desc: "Narrow shoulders, lean waist & limbs" },
  { id: "neutral", label: "Athletic / Balanced", desc: "Evenly balanced, tailored fit" },
  { id: "curvy", label: "Curvy / Broad", desc: "Broader shoulders & defined hips" },
];

export const PRESENTATIONS: { id: StylePresentationType; label: string; desc: string }[] = [
  { id: "feminine", label: "Feminine Silhouette", desc: "Tapered waist, rounded hip line" },
  { id: "neutral", label: "Neutral / Unisex", desc: "Modern straight-cut editorial silhouette" },
  { id: "masculine", label: "Masculine Silhouette", desc: "Broad shoulders, straight torso line" },
];

export const SKIN_TONES = [
  { id: "porcelain", label: "Porcelain Fair", group: "fair", hex: "#FBECE2" },
  { id: "fair", label: "Warm Ivory", group: "fair", hex: "#F3D5C0" },
  { id: "wheat", label: "Golden Honey", group: "medium", hex: "#D59D7B" },
  { id: "olive", label: "Rich Caramel", group: "medium", hex: "#B8784C" },
  { id: "almond", label: "Warm Bronze", group: "dark", hex: "#8F5433" },
  { id: "espresso", label: "Deep Espresso", group: "dark", hex: "#5E3622" },
  { id: "ebony", label: "Rich Ebony", group: "dark", hex: "#3B2216" },
];

export const BASE_WEAR_COLORS = [
  { id: "graphite", label: "Minimalist Graphite", hex: "#232326" },
  { id: "sand", label: "Sandstone Oat", hex: "#D8CEBE" },
  { id: "white", label: "Studio White", hex: "#F3F3F5" },
  { id: "terracotta", label: "Terracotta Clay", hex: "#A35D43" },
];

export const HEIGHTS = [
  { id: "petite", label: "Petite", scale: 0.94 },
  { id: "regular", label: "Standard", scale: 1.0 },
  { id: "tall", label: "Tall", scale: 1.06 },
];

export const FASHION_STANCES: { id: FashionStanceType; label: string; badge: string; desc: string }[] = [
  { id: "runway_confident", label: "Runway Confident", badge: "✦ Signature", desc: "Weight-shifted S-curve with natural contrapposto" },
  { id: "casual_streetwear", label: "Casual Streetwear", badge: "Street", desc: "Relaxed slouch posture with hands towards pockets" },
  { id: "editorial_chic", label: "Editorial Chic", badge: "Lookbook", desc: "Dynamic angular pose with elongated high fashion poise" },
  { id: "neutral_pose", label: "Natural Rest", badge: "Clean", desc: "Neutral symmetrical A-pose for wardrobe inspection" },
];

export function AvatarDesignerStudio({
  initialPreset = "neutral_medium",
  initialPresentation = "neutral",
  initialOutfit,
  initialModelType = "procedural",
  initialHairStyle = "wavy_curtains",
  initialHairColorHex = "#18181A",
  initialEyewear = "none",
  initialStance = "runway_confident",
  onChange,
  onSave,
  className,
  showSaveButton = true,
}: AvatarDesignerStudioProps & { initialStance?: FashionStanceType }) {
  // Parse preset
  const [initialBuild, initialSkinGroup] = (initialPreset.split("_") as [BuildType, string]) || [
    "neutral",
    "medium",
  ];

  const [modelType, setModelType] = useState<ModelPresetType>(initialModelType);
  const [hairStyle, setHairStyle] = useState<HairstyleType>(initialHairStyle);
  const [hairColorHex, setHairColorHex] = useState(initialHairColorHex);
  const [eyewear, setEyewear] = useState<EyewearType>(initialEyewear);
  const [stance, setStance] = useState<FashionStanceType>(initialStance);

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

  // Snapchat-style Category & Dynamic Camera Framing State
  const [activeCategory, setActiveCategory] = useState<CustomizerCategory>("outfits");
  const [cameraFocus, setCameraFocus] = useState<CameraFocusTarget>("full");
  const [autoRotate, setAutoRotate] = useState(false);

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
        if (parsed.modelType) setModelType(parsed.modelType);
        if (parsed.hairStyle) setHairStyle(parsed.hairStyle);
        if (parsed.hairColorHex) setHairColorHex(parsed.hairColorHex);
        if (parsed.eyewear) setEyewear(parsed.eyewear);
        if (parsed.stance && FASHION_STANCES.some((s) => s.id === parsed.stance)) setStance(parsed.stance);
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

  useEffect(() => {
    const cfg = {
      preset: mappedPreset,
      presentation,
      skinToneHex,
      baseWearHex,
      heightScale,
      build,
      bodyMorphs,
      modelType,
      hairStyle,
      hairColorHex,
      eyewear,
      stance,
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
  }, [
    mappedPreset,
    presentation,
    skinToneHex,
    baseWearHex,
    heightScale,
    build,
    bodyMorphs,
    modelType,
    hairStyle,
    hairColorHex,
    eyewear,
    stance,
    outfitConfig,
    onChange,
  ]);

  // Snapchat-style category navigation handler with smooth camera auto-framing
  const selectCategory = (cat: CustomizerCategory) => {
    setActiveCategory(cat);
    switch (cat) {
      case "hair":
      case "hair_color":
      case "glasses":
      case "skin":
        setCameraFocus("face");
        break;
      case "tops":
        setCameraFocus("torso");
        break;
      case "bottoms":
        setCameraFocus("legs");
        break;
      case "shoes":
        setCameraFocus("shoes");
        break;
      case "outfits":
      case "figure":
      case "model":
      default:
        setCameraFocus("full");
        break;
    }
  };

  function handleSave() {
    const cfg = {
      preset: mappedPreset,
      presentation,
      skinToneHex,
      baseWearHex,
      heightScale,
      build,
      modelType,
      hairStyle,
      hairColorHex,
      eyewear,
      stance,
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
    <div className={cn("space-y-4", className)}>
      {/* 3D Interactive Stage with Floating Snapchat-Style Controls */}
      <div className="relative rounded-3xl border-2 border-ink/20 bg-gradient-to-b from-sun/10 via-card to-card overflow-hidden shadow-sm">
        {/* Top Floating Stage Bar */}
        <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
          {/* Quick Camera Focus Shortcuts */}
          <div className="flex items-center gap-1 bg-card/85 backdrop-blur-md px-1.5 py-1 rounded-full border border-ink/15 shadow-xs pointer-events-auto">
            <button
              type="button"
              onClick={() => setCameraFocus("full")}
              title="Full Body View"
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all",
                cameraFocus === "full" ? "bg-ink text-white" : "text-muted-foreground hover:text-ink"
              )}
            >
              Full
            </button>
            <button
              type="button"
              onClick={() => setCameraFocus("face")}
              title="Face & Hair Close-up"
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all",
                cameraFocus === "face" ? "bg-ink text-white" : "text-muted-foreground hover:text-ink"
              )}
            >
              Face
            </button>
            <button
              type="button"
              onClick={() => setCameraFocus("torso")}
              title="Upper Torso & Tops"
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all",
                cameraFocus === "torso" ? "bg-ink text-white" : "text-muted-foreground hover:text-ink"
              )}
            >
              Torso
            </button>
            <button
              type="button"
              onClick={() => setCameraFocus("shoes")}
              title="Shoes & Footwear"
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all",
                cameraFocus === "shoes" ? "bg-ink text-white" : "text-muted-foreground hover:text-ink"
              )}
            >
              Shoes
            </button>
          </div>

          {/* 360 Spin Toggle Button */}
          <button
            type="button"
            onClick={() => setAutoRotate((v) => !v)}
            title="Toggle 360° Rotation"
            className={cn(
              "h-8 w-8 rounded-full border border-ink/20 flex items-center justify-center transition-all pointer-events-auto backdrop-blur-md shadow-xs active:scale-90",
              autoRotate ? "bg-sun text-ink border-ink" : "bg-card/85 text-muted-foreground hover:text-ink"
            )}
          >
            <RotateCw className={cn("h-4 w-4", autoRotate && "animate-spin [animation-duration:4s]")} />
          </button>
        </div>

        {/* 3D Mannequin Viewport */}
        <ThreeMannequinViewer
          modelType={modelType}
          build={build}
          skinToneHex={skinToneHex}
          hairStyle={hairStyle}
          hairColorHex={hairColorHex}
          eyewear={eyewear}
          presentation={presentation}
          baseWearHex={baseWearHex}
          heightScale={heightScale}
          bodyMorphs={bodyMorphs}
          autoRotateDefault={autoRotate}
          outfit={outfitConfig}
          cameraFocus={cameraFocus}
          stance={stance}
          className="h-[380px] w-full"
        />

        {/* Hint banner at bottom of stage */}
        <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
          <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80 bg-card/70 backdrop-blur-sm px-3 py-0.5 rounded-full border border-ink/10">
            Drag to rotate 360° ✦ Pinch or scroll to zoom
          </span>
        </div>
      </div>

      {/* Snapchat-Style Horizontal Category Navigation Tray */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 [scrollbar-width:none]">
        {[
          { id: "outfits", label: "Outfits", icon: Sparkles },
          { id: "tops", label: "Tops", icon: Shirt },
          { id: "bottoms", label: "Bottoms", icon: Layers },
          { id: "shoes", label: "Shoes", icon: Footprints },
          { id: "hair", label: "Hair Style", icon: Scissors },
          { id: "hair_color", label: "Hair Color", icon: Palette },
          { id: "glasses", label: "Glasses", icon: Glasses },
          { id: "skin", label: "Complexion", icon: Wand2 },
          { id: "figure", label: "Figure", icon: User },
          { id: "model", label: "3D Model", icon: Box },
        ].map((cat) => {
          const Icon = cat.icon;
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => selectCategory(cat.id as CustomizerCategory)}
              className={cn(
                "rounded-full border-[1.5px] px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95",
                active
                  ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D] text-ink"
                  : "border-ink/15 bg-card/60 text-muted-foreground hover:border-ink hover:text-ink"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Live Color Palette Bar (Snapchat Swatch Tray) */}
      {(activeCategory === "tops" ||
        activeCategory === "bottoms" ||
        activeCategory === "shoes" ||
        activeCategory === "hair" ||
        activeCategory === "hair_color" ||
        activeCategory === "skin") && (
        <div className="bg-card/70 backdrop-blur-sm p-3 rounded-2xl border border-ink/15 animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Palette className="h-3 w-3" /> Live Fabric & Color Tinting
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {activeCategory === "tops" &&
              TOP_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setOutfitConfig((prev) => ({ ...prev, topColor: c.hex }))}
                  title={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full border-[1.5px] border-ink shadow-xs shrink-0 transition-transform active:scale-90 flex items-center justify-center",
                    outfitConfig.topColor === c.hex && "ring-2 ring-sun scale-110"
                  )}
                  style={{ background: c.hex }}
                >
                  {outfitConfig.topColor === c.hex && (
                    <Check
                      className={cn(
                        "h-4 w-4 stroke-[3]",
                        c.hex === "#F4F0E8" ? "text-ink" : "text-white"
                      )}
                    />
                  )}
                </button>
              ))}

            {activeCategory === "bottoms" &&
              BOTTOM_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setOutfitConfig((prev) => ({ ...prev, bottomColor: c.hex }))}
                  title={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full border-[1.5px] border-ink shadow-xs shrink-0 transition-transform active:scale-90 flex items-center justify-center",
                    outfitConfig.bottomColor === c.hex && "ring-2 ring-sun scale-110"
                  )}
                  style={{ background: c.hex }}
                >
                  {outfitConfig.bottomColor === c.hex && (
                    <Check
                      className={cn(
                        "h-4 w-4 stroke-[3]",
                        c.hex === "#EFECE6" ? "text-ink" : "text-white"
                      )}
                    />
                  )}
                </button>
              ))}

            {activeCategory === "shoes" &&
              SHOES_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setOutfitConfig((prev) => ({ ...prev, shoesColor: c.hex }))}
                  title={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full border-[1.5px] border-ink shadow-xs shrink-0 transition-transform active:scale-90 flex items-center justify-center",
                    outfitConfig.shoesColor === c.hex && "ring-2 ring-sun scale-110"
                  )}
                  style={{ background: c.hex }}
                >
                  {outfitConfig.shoesColor === c.hex && (
                    <Check
                      className={cn(
                        "h-4 w-4 stroke-[3]",
                        c.hex === "#FFFFFF" ? "text-ink" : "text-white"
                      )}
                    />
                  )}
                </button>
              ))}

            {(activeCategory === "hair" || activeCategory === "hair_color") &&
              HAIR_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setHairColorHex(c.hex)}
                  title={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full border-[1.5px] border-ink shadow-xs shrink-0 transition-transform active:scale-90 flex items-center justify-center",
                    hairColorHex === c.hex && "ring-2 ring-sun scale-110"
                  )}
                  style={{ background: c.hex }}
                >
                  {hairColorHex === c.hex && (
                    <Check
                      className={cn(
                        "h-4 w-4 stroke-[3]",
                        c.hex === "#D6D1CA" ? "text-ink" : "text-white"
                      )}
                    />
                  )}
                </button>
              ))}

            {activeCategory === "skin" &&
              SKIN_TONES.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSkinToneHex(c.hex)}
                  title={c.label}
                  className={cn(
                    "h-8 w-8 rounded-full border-[1.5px] border-ink shadow-xs shrink-0 transition-transform active:scale-90 flex items-center justify-center",
                    skinToneHex === c.hex && "ring-2 ring-sun scale-110"
                  )}
                  style={{ background: c.hex }}
                >
                  {skinToneHex === c.hex && (
                    <Check className="h-4 w-4 stroke-[3] text-ink drop-shadow-xs" />
                  )}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Customization Drawer Body (Tab Content Cards) */}
      <div className="bg-card rounded-3xl border-2 border-ink/20 p-4 shadow-sm min-h-[220px]">
        {/* 1. OUTFITS TAB (Curated 1-Click Looks) */}
        {activeCategory === "outfits" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Curated Stylist Looks (1-Click Try-On)
              </span>
              <button
                type="button"
                onClick={() =>
                  setOutfitConfig({
                    topType: "none",
                    bottomType: "none",
                    shoesType: "none",
                  })
                }
                className="text-[11px] font-bold text-muted-foreground hover:text-ink underline"
              >
                Clear all clothes
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      "card-pop p-3 text-left transition-all flex items-center justify-between active:scale-95 cursor-pointer",
                      isSelected
                        ? "translate-x-[2px] translate-y-[2px] shadow-none ring-2 ring-sun bg-sun/15"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        {preset.vibe}
                      </span>
                      <p className="text-xs font-bold text-foreground">{preset.name}</p>
                    </div>
                    {isSelected ? (
                      <span className="h-6 w-6 rounded-full bg-sun border-[1.5px] border-ink flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 stroke-[3] text-ink" />
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-muted-foreground">Try on ✦</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. TOPS TAB */}
        {activeCategory === "tops" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Choose Upper Garment Layer
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "none", label: "Bare / Bodysuit", desc: "No shirt layer" },
                { id: "tee", label: "Crewneck Tee", desc: "Minimalist short-sleeve tee" },
                { id: "shirt", label: "Linen Shirt", desc: "Buttoned relaxed tailoring" },
                { id: "jacket", label: "Trench / Coat", desc: "Layered tailored outerwear" },
              ].map((t) => {
                const active = (outfitConfig.topType || "none") === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setOutfitConfig((prev) => ({
                        ...prev,
                        topType: t.id as TopGarmentType,
                      }))
                    }
                    className={cn(
                      "card-pop p-3 text-left transition-all active:scale-95 cursor-pointer",
                      active
                        ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                        : "border-ink/20 bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">{t.label}</p>
                      {active && <Check className="h-3 w-3 stroke-[3] text-ink" />}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. BOTTOMS TAB */}
        {activeCategory === "bottoms" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Choose Trousers & Pants
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "none", label: "Bare / Underwear", desc: "No pants layer" },
                { id: "trousers", label: "Straight Trousers", desc: "Tailored straight leg" },
                { id: "wide_chinos", label: "Wide-Leg Chinos", desc: "Relaxed volume silhouette" },
                { id: "shorts", label: "Pleated Shorts", desc: "Studio summer shorts" },
              ].map((b) => {
                const active = (outfitConfig.bottomType || "none") === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() =>
                      setOutfitConfig((prev) => ({
                        ...prev,
                        bottomType: b.id as BottomGarmentType,
                      }))
                    }
                    className={cn(
                      "card-pop p-3 text-left transition-all active:scale-95 cursor-pointer",
                      active
                        ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                        : "border-ink/20 bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">{b.label}</p>
                      {active && <Check className="h-3 w-3 stroke-[3] text-ink" />}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{b.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. SHOES TAB */}
        {activeCategory === "shoes" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Choose Footwear
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "none", label: "Bare Feet", desc: "Natural unadorned foot" },
                { id: "sneakers", label: "Low-Top Sneakers", desc: "Chunky atelier sneaker" },
                { id: "loafers", label: "Leather Loafers", desc: "Sleek tailored loafer" },
              ].map((s) => {
                const active = (outfitConfig.shoesType || "none") === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setOutfitConfig((prev) => ({
                        ...prev,
                        shoesType: s.id as ShoesGarmentType,
                      }))
                    }
                    className={cn(
                      "card-pop p-3 text-left transition-all active:scale-95 cursor-pointer",
                      active
                        ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                        : "border-ink/20 bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">{s.label}</p>
                      {active && <Check className="h-3 w-3 stroke-[3] text-ink" />}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{s.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. HAIR STYLE TAB */}
        {activeCategory === "hair" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Modular 3D Hairstyles
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {HAIRSTYLES.map((h) => {
                const active = hairStyle === h.id;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHairStyle(h.id)}
                    className={cn(
                      "card-pop p-3 text-left transition-all active:scale-95 cursor-pointer",
                      active
                        ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                        : "border-ink/20 bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">{h.label}</p>
                      {active && <Check className="h-3 w-3 stroke-[3] text-ink" />}
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{h.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. HAIR COLOR TAB */}
        {activeCategory === "hair_color" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              PBR Hair Dye Palette
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {HAIR_COLORS.map((c) => {
                const active = hairColorHex === c.hex;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setHairColorHex(c.hex)}
                    className={cn(
                      "card-pop flex items-center gap-3 p-3 text-left transition-all active:scale-95 cursor-pointer",
                      active
                        ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                        : "border-ink/20 bg-card hover:bg-muted/40"
                    )}
                  >
                    <span
                      className="h-7 w-7 shrink-0 rounded-full border-[1.5px] border-ink shadow-xs flex items-center justify-center"
                      style={{ background: c.hex }}
                    >
                      {active && (
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 stroke-[3]",
                            c.id === "platinum_ash" ? "text-ink" : "text-white"
                          )}
                        />
                      )}
                    </span>
                    <span className="text-xs font-bold text-foreground">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. GLASSES & EYEWEAR */}
        {activeCategory === "glasses" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Designer Eyewear & Sunglasses
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {EYEWEAR_OPTIONS.map((opt) => {
                const active = eyewear === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setEyewear(opt.id)}
                    className={cn(
                      "card-pop p-3.5 text-left transition-all active:scale-95 cursor-pointer",
                      active
                        ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                        : "border-ink/20 bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">{opt.label}</p>
                      {active && <Check className="h-3 w-3 stroke-[3] text-ink" />}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-tight">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 8. COMPLEXION & SKIN TONES */}
        {activeCategory === "skin" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Editorial Complexion Palette
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SKIN_TONES.map((st) => {
                const active = skinToneHex === st.hex;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSkinToneHex(st.hex)}
                    className={cn(
                      "card-pop flex items-center gap-3 p-3 text-left transition-all active:scale-95 cursor-pointer",
                      active
                        ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                        : "border-ink/20 bg-card hover:bg-muted/40"
                    )}
                  >
                    <span
                      className="h-7 w-7 shrink-0 rounded-full border-[1.5px] border-ink shadow-xs flex items-center justify-center"
                      style={{ background: st.hex }}
                    >
                      {active && <Check className="h-3.5 w-3.5 stroke-[3] text-ink drop-shadow-xs" />}
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

        {/* 9. FIGURE & BUILD */}
        {activeCategory === "figure" && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Style Vibe */}
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Silhouette Presentation
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESENTATIONS.map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setPresentation(pr.id)}
                    className="chip text-[12px]"
                    data-active={presentation === pr.id}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Build */}
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Body Silhouette
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BUILDS.map((b) => {
                  const active = build === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBuild(b.id)}
                      className={cn(
                        "card-pop p-2.5 text-left transition-all active:scale-95 cursor-pointer",
                        active
                          ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                          : "border-ink/20 bg-card hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-foreground">{b.label}</p>
                        {active && <Check className="h-3 w-3 stroke-[3] text-ink" />}
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground leading-tight line-clamp-1">
                        {b.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Height Scale */}
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Height Profile
              </span>
              <div className="flex gap-2">
                {HEIGHTS.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHeightScale(h.scale)}
                    className="chip text-[12px] flex-1"
                    data-active={heightScale === h.scale}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Attitude & Fashion Stance */}
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Attitude & Fashion Stance
              </span>
              <div className="grid grid-cols-2 gap-2">
                {FASHION_STANCES.map((s) => {
                  const active = stance === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStance(s.id)}
                      className={cn(
                        "card-pop p-2.5 text-left transition-all active:scale-95 cursor-pointer",
                        active
                          ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                          : "border-ink/20 bg-card hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{s.label}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-ink/5 px-2 py-0.5 rounded-full">
                          {s.badge}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground leading-tight">
                        {s.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 10. 3D BASE MODEL */}
        {activeCategory === "model" && (
          <div className="space-y-3 animate-in fade-in-50 duration-200">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              3D Engine & Avatar Base Mesh
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MANNEQUIN_MODELS.map((m) => {
                const active = modelType === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModelType(m.id)}
                    className={cn(
                      "card-pop p-3 text-left transition-all active:scale-95 cursor-pointer",
                      active
                        ? "border-ink bg-sun shadow-[2px_2px_0px_#1B1B1D]"
                        : "border-ink/20 bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{m.name}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground bg-ink/5 px-2 py-0.5 rounded-full">
                        {m.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{m.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      {showSaveButton && onSave && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="btn-pop w-full py-3.5 text-base flex items-center justify-center gap-2"
            data-tone="pink"
          >
            <Sparkles className="h-4 w-4" /> Save 3D Avatar Profile
          </button>
        </div>
      )}
    </div>
  );
}
