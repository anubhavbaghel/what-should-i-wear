import { z } from "zod";

export const MANNEQUIN_PRESETS = [
  "neutral_light",
  "neutral_medium",
  "neutral_dark",
  "curvy_light",
  "curvy_medium",
  "curvy_dark",
  "slim_light",
  "slim_medium",
  "slim_dark",
] as const;

export type MannequinPreset = (typeof MANNEQUIN_PRESETS)[number];
export type StylePresentation = "neutral" | "masculine" | "feminine";
export type BuildType = "slim" | "neutral" | "curvy";
export type BodyFrameType = "slim" | "athletic" | "curvy" | "average";
export type CameraFocusTarget = "full" | "face" | "torso" | "shoes";
export type FashionStanceType =
  | "runway_confident"
  | "casual_streetwear"
  | "editorial_chic"
  | "neutral_pose";

export type TopGarmentType = "none" | "tee" | "shirt" | "jacket";
export type BottomGarmentType = "none" | "trousers" | "wide_chinos" | "shorts";
export type ShoesGarmentType = "none" | "sneakers" | "loafers";

export interface BodyMorphConfig {
  shoulderWidth?: number; // 0.75 to 1.35, default 1.0
  chestBust?: number;     // 0.80 to 1.30, default 1.0
  waistScale?: number;    // 0.75 to 1.35, default 1.0
  hipWidth?: number;      // 0.80 to 1.35, default 1.0
}

export interface MannequinOutfitConfig {
  topType?: TopGarmentType;
  topColor?: string;
  bottomType?: BottomGarmentType;
  bottomColor?: string;
  shoesType?: ShoesGarmentType;
  shoesColor?: string;
}

export interface AvatarConfig {
  modelType?: "/models/female-twin.glb" | "/models/male-twin.glb" | string;
  presentation?: StylePresentation;
  bodyFrame?: BodyFrameType;
  build?: BuildType;
  heightCm?: number;
  heightScale?: number;
  skinToneHex?: string;
  baseWearHex?: string;
  shoulderPct?: number;
  waistPct?: number;
  bodyMorphs?: BodyMorphConfig;
  hairStyle?: string;
  hairColorHex?: string;
  eyewear?: string;
  stance?: FashionStanceType;
  outfit?: MannequinOutfitConfig;
}

export const mannequinOutfitSchema = z.object({
  topType: z.enum(["none", "tee", "shirt", "jacket"]).optional(),
  topColor: z.string().optional(),
  bottomType: z.enum(["none", "trousers", "wide_chinos", "shorts"]).optional(),
  bottomColor: z.string().optional(),
  shoesType: z.enum(["none", "sneakers", "loafers"]).optional(),
  shoesColor: z.string().optional(),
});

export const bodyMorphConfigSchema = z.object({
  shoulderWidth: z.number().min(0.5).max(1.8).optional(),
  chestBust: z.number().min(0.5).max(1.8).optional(),
  waistScale: z.number().min(0.5).max(1.8).optional(),
  hipWidth: z.number().min(0.5).max(1.8).optional(),
});

export const avatarConfigSchema = z.object({
  modelType: z.string().optional(),
  presentation: z.enum(["neutral", "masculine", "feminine"]).optional(),
  bodyFrame: z.enum(["slim", "athletic", "curvy", "average"]).optional(),
  build: z.enum(["slim", "neutral", "curvy"]).optional(),
  heightCm: z.number().min(140).max(215).optional(),
  heightScale: z.number().min(0.8).max(1.3).optional(),
  skinToneHex: z.string().optional(),
  baseWearHex: z.string().optional(),
  shoulderPct: z.number().min(10).max(90).optional(),
  waistPct: z.number().min(10).max(90).optional(),
  bodyMorphs: bodyMorphConfigSchema.optional(),
  hairStyle: z.string().optional(),
  hairColorHex: z.string().optional(),
  eyewear: z.string().optional(),
  stance: z.enum(["runway_confident", "casual_streetwear", "editorial_chic", "neutral_pose"]).optional(),
  outfit: mannequinOutfitSchema.optional(),
});

/**
 * Maps granular bodyFrame + skinToneHex to a valid member of MANNEQUIN_PRESETS
 * for database storage in profiles.mannequin_preset.
 */
export function mapToStandardPreset(
  bodyFrame?: BodyFrameType | string,
  skinToneHex?: string
): MannequinPreset {
  let buildKey: "slim" | "neutral" | "curvy" = "neutral";
  if (bodyFrame === "slim") buildKey = "slim";
  else if (bodyFrame === "curvy") buildKey = "curvy";
  else buildKey = "neutral";

  let skinKey: "light" | "medium" | "dark" = "medium";
  if (skinToneHex && skinToneHex.startsWith("#")) {
    const hex = skinToneHex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 200;
    const g = parseInt(hex.substring(2, 4), 16) || 150;
    const b = parseInt(hex.substring(4, 6), 16) || 120;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness > 215) skinKey = "light";
    else if (brightness < 125) skinKey = "dark";
    else skinKey = "medium";
  }

  const candidate = `${buildKey}_${skinKey}` as MannequinPreset;
  return MANNEQUIN_PRESETS.includes(candidate) ? candidate : "neutral_medium";
}
