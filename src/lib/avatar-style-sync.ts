/**
 * avatar-style-sync.ts
 *
 * Synchronization and resolution helper for the /style route avatar configuration.
 * Bridges authenticated profile data (or demo store) to ThreeMannequinViewer,
 * ensuring saved body proportions, height scale, presets, and presentation
 * remain consistent and reactive without accumulating transformations.
 */

import type {
  AvatarConfig,
  BodyFrameType,
  BodyMorphConfig,
  BuildType,
  StylePresentation,
  FashionStanceType,
} from "./avatar.types.ts";
import { calculateEffectiveMultipliers } from "./avatar-transform.ts";

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  modelType: "/models/female-twin.glb",
  presentation: "feminine",
  bodyFrame: "athletic",
  build: "neutral",
  heightCm: 165,
  heightScale: 1.0,
  skinToneHex: "#D59D7B",
  baseWearHex: "#18181A",
  shoulderPct: 50,
  waistPct: 48,
  bodyMorphs: {
    shoulderWidth: 1.14,
    waistScale: 0.94,
    hipWidth: 1.0,
    chestBust: 1.1,
  },
  hairStyle: "wavy_curtains",
  hairColorHex: "#18181A",
  eyewear: "none",
  stance: "runway_confident",
};

/**
 * Maps a preset string (e.g. "slim_light", "curvy_dark", "neutral_medium")
 * to its corresponding anatomical BodyFrameType.
 */
export function presetToBodyFrame(preset?: string): BodyFrameType {
  if (!preset) return "athletic";
  const [buildKey] = preset.toLowerCase().split("_");
  if (buildKey === "slim") return "slim";
  if (buildKey === "curvy") return "curvy";
  if (buildKey === "average") return "average";
  return "athletic";
}

/**
 * Derives effective bodyMorphs and heightScale for a given preset
 * using calculateEffectiveMultipliers without accumulating old morph overrides.
 */
export function deriveBodyMorphsForPreset(
  preset: string,
  existingConfig?: Partial<AvatarConfig>,
): { bodyMorphs: BodyMorphConfig; heightScale: number; bodyFrame: BodyFrameType } {
  const bodyFrame = presetToBodyFrame(preset);
  const effective = calculateEffectiveMultipliers({
    bodyFrame,
    shoulderPct: existingConfig?.shoulderPct ?? 50,
    waistPct: existingConfig?.waistPct ?? 50,
    heightCm: existingConfig?.heightCm,
    heightScale:
      existingConfig?.heightScale ??
      (existingConfig?.heightCm ? existingConfig.heightCm / 170 : 1.0),
  });

  return {
    bodyFrame,
    bodyMorphs: {
      shoulderWidth: effective.shoulderWidth,
      waistScale: effective.waistScale,
      hipWidth: effective.hipWidth,
      chestBust: effective.chestBust,
    },
    heightScale: effective.heightScale,
  };
}

/**
 * Resolves the full AvatarConfig for /style from profile query data.
 * Merges saved profile config with defaults and derives any missing morphs.
 */
export function resolveStyleAvatarConfig(params: {
  profileData?: {
    profile?: { mannequin_preset?: string | null } | null;
    stylePresentation?: string | null;
    avatarConfig?: AvatarConfig | null;
  } | null;
  currentPreset?: string;
  currentPresentation?: string;
}): AvatarConfig {
  const { profileData, currentPreset, currentPresentation } = params;
  const savedConfig = profileData?.avatarConfig;
  const activePresentation = (profileData?.stylePresentation ||
    currentPresentation ||
    savedConfig?.presentation ||
    "neutral") as StylePresentation;

  const activePreset = profileData?.profile?.mannequin_preset || currentPreset || "neutral_medium";

  const isMasculine = activePresentation === "masculine";
  const defaultModel = isMasculine ? "/models/male-twin.glb" : "/models/female-twin.glb";

  const resolvedModelType =
    savedConfig?.modelType && savedConfig.modelType !== "procedural"
      ? savedConfig.modelType
      : defaultModel;

  // Determine body morphs: use saved bodyMorphs if fully present, else derive from preset
  let resolvedBodyMorphs = savedConfig?.bodyMorphs;
  let resolvedHeightScale = savedConfig?.heightScale;
  let resolvedBodyFrame = savedConfig?.bodyFrame;

  if (
    !resolvedBodyMorphs ||
    resolvedBodyMorphs.shoulderWidth === undefined ||
    resolvedBodyMorphs.waistScale === undefined ||
    resolvedHeightScale === undefined
  ) {
    const derived = deriveBodyMorphsForPreset(activePreset, savedConfig || undefined);
    resolvedBodyMorphs = derived.bodyMorphs;
    resolvedHeightScale = derived.heightScale;
    resolvedBodyFrame = derived.bodyFrame;
  }

  return {
    ...DEFAULT_AVATAR_CONFIG,
    ...savedConfig,
    modelType: resolvedModelType,
    presentation: activePresentation,
    bodyFrame: resolvedBodyFrame || presetToBodyFrame(activePreset),
    heightScale: resolvedHeightScale,
    bodyMorphs: resolvedBodyMorphs,
    hairStyle: savedConfig?.hairStyle || DEFAULT_AVATAR_CONFIG.hairStyle,
    hairColorHex: savedConfig?.hairColorHex || DEFAULT_AVATAR_CONFIG.hairColorHex,
    eyewear: savedConfig?.eyewear || DEFAULT_AVATAR_CONFIG.eyewear,
    stance: (savedConfig?.stance || DEFAULT_AVATAR_CONFIG.stance) as FashionStanceType,
  };
}

/**
 * Updates AvatarConfig when the user selects a different preset in BodyTypeSelector.
 * Recomputes effective body multipliers deterministically while preserving
 * unrelated properties (hair, clothing, stance, modelType, etc.).
 */
export function applyPresetChangeToAvatarConfig(
  currentConfig: AvatarConfig,
  newPreset: string,
): AvatarConfig {
  const derived = deriveBodyMorphsForPreset(newPreset, currentConfig);
  const [buildKey] = newPreset.toLowerCase().split("_");

  return {
    ...currentConfig,
    bodyFrame: derived.bodyFrame,
    build: (buildKey === "slim" || buildKey === "curvy" ? buildKey : "neutral") as BuildType,
    bodyMorphs: derived.bodyMorphs,
    heightScale: derived.heightScale,
  };
}

/**
 * Updates AvatarConfig when style presentation is toggled on /style.
 * Adjusts presentation and aligns modelType if appropriate while preserving morphs.
 */
export function applyPresentationChangeToAvatarConfig(
  currentConfig: AvatarConfig,
  newPresentation: StylePresentation,
): AvatarConfig {
  const isMasculine = newPresentation === "masculine";
  const modelType = isMasculine ? "/models/male-twin.glb" : "/models/female-twin.glb";

  return {
    ...currentConfig,
    presentation: newPresentation,
    modelType,
  };
}
