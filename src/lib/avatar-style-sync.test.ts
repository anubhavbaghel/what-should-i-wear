/**
 * avatar-style-sync.test.ts
 *
 * Automated regression tests for avatar configuration synchronization on /style.
 * Run with: node --test src/lib/avatar-style-sync.test.ts
 */

import test from "node:test";
import assert from "node:assert";
import {
  resolveStyleAvatarConfig,
  applyPresetChangeToAvatarConfig,
  applyPresentationChangeToAvatarConfig,
  deriveBodyMorphsForPreset,
  presetToBodyFrame,
  DEFAULT_AVATAR_CONFIG,
} from "./avatar-style-sync.ts";
import type { AvatarConfig } from "./avatar.types.ts";

test("1. Saved AvatarConfig Propagation: Fully saved profile config is accurately resolved for /style", () => {
  const savedConfig: AvatarConfig = {
    modelType: "/models/female-twin.glb",
    presentation: "feminine",
    bodyFrame: "curvy",
    heightCm: 180,
    heightScale: 180 / 170,
    shoulderPct: 75,
    waistPct: 35,
    bodyMorphs: {
      shoulderWidth: 1.15,
      waistScale: 0.85,
      hipWidth: 1.22,
      chestBust: 1.18,
    },
    hairStyle: "sleek_bob",
    hairColorHex: "#63432B",
    eyewear: "classic_wayfarer",
    stance: "editorial_chic",
  };

  const profileData = {
    profile: { mannequin_preset: "curvy_medium" },
    stylePresentation: "feminine",
    avatarConfig: savedConfig,
  };

  const resolved = resolveStyleAvatarConfig({ profileData });

  assert.strictEqual(resolved.modelType, "/models/female-twin.glb");
  assert.strictEqual(resolved.presentation, "feminine");
  assert.strictEqual(resolved.heightScale, 180 / 170);
  assert.strictEqual(resolved.bodyMorphs?.shoulderWidth, 1.15);
  assert.strictEqual(resolved.bodyMorphs?.waistScale, 0.85);
  assert.strictEqual(resolved.bodyMorphs?.hipWidth, 1.22);
  assert.strictEqual(resolved.bodyMorphs?.chestBust, 1.18);
  assert.strictEqual(resolved.hairStyle, "sleek_bob");
  assert.strictEqual(resolved.hairColorHex, "#63432B");
  assert.strictEqual(resolved.eyewear, "classic_wayfarer");
  assert.strictEqual(resolved.stance, "editorial_chic");
});

test("2. Fallback & Incomplete Config: Derives missing bodyMorphs and heightScale safely", () => {
  // Config with missing bodyMorphs and heightScale
  const partialConfig: Partial<AvatarConfig> = {
    modelType: "/models/male-twin.glb",
    presentation: "masculine",
    hairStyle: "fade",
  };

  const profileData = {
    profile: { mannequin_preset: "slim_dark" },
    stylePresentation: "masculine",
    avatarConfig: partialConfig as AvatarConfig,
  };

  const resolved = resolveStyleAvatarConfig({ profileData });

  assert.strictEqual(resolved.modelType, "/models/male-twin.glb");
  assert.strictEqual(resolved.presentation, "masculine");
  assert.strictEqual(resolved.bodyFrame, "slim");
  assert.ok(resolved.bodyMorphs !== undefined);
  assert.strictEqual(resolved.bodyMorphs?.shoulderWidth, 0.92);
  assert.strictEqual(resolved.bodyMorphs?.waistScale, 0.88);
  assert.strictEqual(resolved.bodyMorphs?.hipWidth, 0.92);
  assert.ok(resolved.heightScale !== undefined);
  assert.strictEqual(resolved.hairStyle, "fade");
});

test("3. Null / Unauthenticated State: Returns validated defaults without error", () => {
  const resolved = resolveStyleAvatarConfig({
    profileData: null,
    currentPreset: "neutral_medium",
    currentPresentation: "neutral",
  });

  assert.ok(resolved.modelType);
  assert.ok(resolved.bodyMorphs);
  assert.strictEqual(resolved.heightScale, 1.0);
  assert.strictEqual(resolved.stance, "runway_confident");
  assert.strictEqual(resolved.hairStyle, "wavy_curtains");
});

test("4. Preset Switching: Updates bodyMorphs and build while preserving unrelated fields", () => {
  const initialConfig: AvatarConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    hairStyle: "afro_curls",
    hairColorHex: "#C79C64",
    eyewear: "chic_beanie",
    stance: "casual_streetwear",
    shoulderPct: 60,
    waistPct: 40,
  };

  // Switch to curvy_light
  const updated = applyPresetChangeToAvatarConfig(initialConfig, "curvy_light");

  assert.strictEqual(updated.bodyFrame, "curvy");
  assert.strictEqual(updated.build, "curvy");
  // Multipliers updated from curvy preset baseline
  assert.strictEqual(updated.bodyMorphs?.hipWidth, 1.18);
  // Preserved unrelated fields
  assert.strictEqual(updated.hairStyle, "afro_curls");
  assert.strictEqual(updated.hairColorHex, "#C79C64");
  assert.strictEqual(updated.eyewear, "chic_beanie");
  assert.strictEqual(updated.stance, "casual_streetwear");
  assert.strictEqual(updated.shoulderPct, 60);
  assert.strictEqual(updated.waistPct, 40);
});

test("5. Preset Switching Determinism: Repeated switching does not accumulate drift", () => {
  let config: AvatarConfig = { ...DEFAULT_AVATAR_CONFIG };

  // Switch back and forth 50 times between slim and curvy
  for (let i = 0; i < 50; i++) {
    config = applyPresetChangeToAvatarConfig(config, i % 2 === 0 ? "slim_light" : "curvy_dark");
  }

  // Switch to neutral_medium
  const finalConfig = applyPresetChangeToAvatarConfig(config, "neutral_medium");
  const directConfig = applyPresetChangeToAvatarConfig(DEFAULT_AVATAR_CONFIG, "neutral_medium");

  assert.strictEqual(finalConfig.bodyMorphs?.shoulderWidth, directConfig.bodyMorphs?.shoulderWidth);
  assert.strictEqual(finalConfig.bodyMorphs?.waistScale, directConfig.bodyMorphs?.waistScale);
  assert.strictEqual(finalConfig.bodyMorphs?.hipWidth, directConfig.bodyMorphs?.hipWidth);
  assert.strictEqual(finalConfig.bodyMorphs?.chestBust, directConfig.bodyMorphs?.chestBust);
});

test("6. Presentation Switching: Aligns modelType and presentation while preserving proportions", () => {
  const initialConfig: AvatarConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    bodyMorphs: {
      shoulderWidth: 1.2,
      waistScale: 0.9,
      hipWidth: 1.1,
      chestBust: 1.15,
    },
  };

  const switched = applyPresentationChangeToAvatarConfig(initialConfig, "masculine");

  assert.strictEqual(switched.presentation, "masculine");
  assert.strictEqual(switched.modelType, "/models/male-twin.glb");
  assert.strictEqual(switched.bodyMorphs?.shoulderWidth, 1.2);
  assert.strictEqual(switched.bodyMorphs?.waistScale, 0.9);
});
