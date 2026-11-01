/**
 * avatar-transform.ts
 *
 * Deterministic Transformation System for 3D Avatars (female-twin.glb & male-twin.glb).
 *
 * Transformation Architecture:
 *   Loaded Model + Immutable Baseline + Validated AvatarConfig -> Customized Model
 *
 * Guarantees:
 * 1. Determinism: Identical configurations produce identical world transforms.
 * 2. Zero Cumulative Drift: Transforms are derived strictly from immutable bind-pose baselines.
 * 3. Exact Reset: Reverting parameters restores initial bind-pose transforms (tolerance < 1e-6).
 * 4. Anatomical Isolation: Counter-scaling guarantees the head, neck, arms, and legs maintain
 *    uncompromised geometry while chest, shoulders, waist, and hips adjust smoothly.
 * 5. Floor Pinning: Height scaling is anchored to the ground contact plane (Y = -1.12),
 *    preventing feet from penetrating the floor or floating in air.
 */

import * as THREE from "three";
import type {
  BodyFrameType,
  BodyMorphConfig,
  FashionStanceType,
  AvatarConfig,
} from "./avatar.types.ts";

export interface BoneTransformBaseline {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

export interface SkeletonBaselines {
  modelId: string;
  bones: Record<string, BoneTransformBaseline>;
  groundY: number;
  baseHeight: number;
}

export interface ModelBones {
  hips?: THREE.Bone;
  spine?: THREE.Bone;
  spine1?: THREE.Bone;
  spine2?: THREE.Bone;
  neck?: THREE.Bone;
  head?: THREE.Bone;
  leftShoulder?: THREE.Bone;
  rightShoulder?: THREE.Bone;
  leftArm?: THREE.Bone;
  rightArm?: THREE.Bone;
  leftForeArm?: THREE.Bone;
  rightForeArm?: THREE.Bone;
  leftHand?: THREE.Bone;
  rightHand?: THREE.Bone;
  leftUpLeg?: THREE.Bone;
  rightUpLeg?: THREE.Bone;
  leftLeg?: THREE.Bone;
  rightLeg?: THREE.Bone;
  leftFoot?: THREE.Bone;
  rightFoot?: THREE.Bone;
  [key: string]: THREE.Bone | undefined;
}

export interface BodyGeometryParams {
  bodyFrame?: BodyFrameType;
  shoulderPct?: number;   // 10 to 90, default 50
  waistPct?: number;      // 10 to 90, default 50
  heightCm?: number;      // 150 to 195, default 165
  heightScale?: number;   // 0.85 to 1.20, default 1.0 (derived from heightCm / 170)
  bodyMorphs?: BodyMorphConfig;
  stance?: FashionStanceType;
}

export interface EffectiveMultipliers {
  shoulderWidth: number;
  waistScale: number;
  chestBust: number;
  hipWidth: number;
  heightScale: number;
}

// Canonical Presets with anatomical baseline definitions
export const PRESET_BASE_MULTIPLIERS: Record<
  BodyFrameType,
  { shoulderWidth: number; waistScale: number; hipWidth: number; chestBust: number }
> = {
  slim: {
    shoulderWidth: 0.92,
    waistScale: 0.88,
    hipWidth: 0.92,
    chestBust: 0.90,
  },
  athletic: {
    shoulderWidth: 1.14,
    waistScale: 0.94,
    hipWidth: 1.00,
    chestBust: 1.10,
  },
  curvy: {
    shoulderWidth: 1.00,
    waistScale: 0.98,
    hipWidth: 1.18,
    chestBust: 1.12,
  },
  average: {
    shoulderWidth: 1.00,
    waistScale: 1.00,
    hipWidth: 1.00,
    chestBust: 1.00,
  },
};

/**
 * Normalizes bone names stripped of mixamorig prefixes and case differences.
 */
export function normalizeBoneName(rawName: string): string {
  return rawName
    .replace(/^mixamorig:?/i, "")
    .replace(/_/g, "")
    .toLowerCase();
}

/**
 * Traverses a loaded GLB hierarchy and captures immutable baselines
 * for all mapped skeleton bones.
 */
export function captureSkeletonBaselines(
  modelRoot: THREE.Object3D,
  modelId: string,
  groundY: number = -1.12,
  baseHeight: number = 2.24
): { bones: ModelBones; baselines: SkeletonBaselines } {
  const bones: ModelBones = {};
  const baselineMap: Record<string, BoneTransformBaseline> = {};

  const nameMapping: Record<string, keyof ModelBones> = {
    hips: "hips",
    spine: "spine",
    spine1: "spine1",
    spine2: "spine2",
    neck: "neck",
    head: "head",
    leftshoulder: "leftShoulder",
    rightshoulder: "rightShoulder",
    leftarm: "leftArm",
    rightarm: "rightArm",
    leftforearm: "leftForeArm",
    rightforearm: "rightForeArm",
    lefthand: "leftHand",
    righthand: "rightHand",
    leftupleg: "leftUpLeg",
    rightupleg: "rightUpLeg",
    leftleg: "leftLeg",
    rightleg: "rightLeg",
    leftfoot: "leftFoot",
    rightfoot: "rightFoot",
  };

  modelRoot.traverse((child) => {
    if ((child as THREE.Bone).isBone) {
      const bone = child as THREE.Bone;
      const normalized = normalizeBoneName(bone.name);
      const mappedKey = nameMapping[normalized];
      if (mappedKey) {
        bones[mappedKey] = bone;
        baselineMap[mappedKey] = {
          position: bone.position.clone(),
          quaternion: bone.quaternion.clone(),
          scale: bone.scale.clone(),
        };
      }
    }
  });

  const baselines: SkeletonBaselines = {
    modelId,
    bones: baselineMap,
    groundY,
    baseHeight,
  };

  return { bones, baselines };
}

/**
 * Calculates effective body multipliers using a strict precedence rule:
 * 1. Base values are derived from the selected BodyFrameType preset.
 * 2. Fine-tuning sliders (shoulderPct, waistPct) apply relative adjustments.
 * 3. Direct bodyMorphs overrides take precedence if explicitly provided.
 * 4. All outputs are strictly clamped to anatomically safe bounds.
 */
export function calculateEffectiveMultipliers(
  params: BodyGeometryParams
): EffectiveMultipliers {
  const frame = params.bodyFrame || "average";
  const base = PRESET_BASE_MULTIPLIERS[frame] || PRESET_BASE_MULTIPLIERS.average;

  const shoulderPct = Math.max(10, Math.min(90, params.shoulderPct ?? 50));
  const waistPct = Math.max(10, Math.min(90, params.waistPct ?? 50));

  let shoulderWidth = base.shoulderWidth * (1 + (shoulderPct - 50) / 100);
  let waistScale = base.waistScale * (1 + (waistPct - 50) / 100);
  let hipWidth = base.hipWidth;
  let chestBust = base.chestBust * (1 + (shoulderPct - 50) / 150);

  // Direct morph overrides if specified
  if (params.bodyMorphs?.shoulderWidth !== undefined) {
    shoulderWidth = params.bodyMorphs.shoulderWidth;
  }
  if (params.bodyMorphs?.waistScale !== undefined) {
    waistScale = params.bodyMorphs.waistScale;
  }
  if (params.bodyMorphs?.hipWidth !== undefined) {
    hipWidth = params.bodyMorphs.hipWidth;
  }
  if (params.bodyMorphs?.chestBust !== undefined) {
    chestBust = params.bodyMorphs.chestBust;
  }

  // Derive heightScale: 170cm = 1.0 baseline
  let heightScale = 1.0;
  if (params.heightScale !== undefined) {
    heightScale = params.heightScale;
  } else if (params.heightCm !== undefined) {
    heightScale = params.heightCm / 170;
  }

  // Clamping to conservative anatomical limits
  return {
    shoulderWidth: Math.max(0.80, Math.min(1.25, shoulderWidth)),
    waistScale: Math.max(0.78, Math.min(1.25, waistScale)),
    chestBust: Math.max(0.80, Math.min(1.25, chestBust)),
    hipWidth: Math.max(0.82, Math.min(1.28, hipWidth)),
    heightScale: Math.max(0.85, Math.min(1.20, heightScale)),
  };
}

/**
 * Applies stance rotations to model bones starting from stored baseline orientations.
 * Returns the stance orientation for Spine1 so breathing animation can multiply cleanly.
 */
export function applyStanceRotations(
  bones: ModelBones,
  baselines: SkeletonBaselines,
  stance: FashionStanceType = "runway_confident",
  isFemale: boolean = true
): { spine1StanceQuat?: THREE.Quaternion } {
  // 1. Reset all bone quaternions to baseline
  Object.keys(baselines.bones).forEach((key) => {
    const b = bones[key];
    const base = baselines.bones[key];
    if (b && base) {
      b.quaternion.copy(base.quaternion);
    }
  });

  const baseArmX = isFemale ? 1.18 : 0.05;

  function rotateBone(key: keyof ModelBones, rx: number, ry: number, rz: number) {
    const b = bones[key];
    const base = baselines.bones[key];
    if (b && base) {
      const deltaQ = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rx, ry, rz, "XYZ")
      );
      b.quaternion.copy(base.quaternion).multiply(deltaQ);
    }
  }

  if (stance === "runway_confident") {
    rotateBone("hips", 0, 0.06, -0.03);
    rotateBone("spine1", 0, -0.04, 0.02);
    rotateBone("head", 0.02, -0.06, 0.02);
    rotateBone("leftArm", baseArmX + 0.06, 0.04, 0);
    rotateBone("leftForeArm", 0.12, 0, 0.18);
    rotateBone("rightArm", baseArmX + 0.02, -0.04, 0);
    rotateBone("rightForeArm", -0.12, 0, -0.18);
  } else if (stance === "casual_streetwear") {
    rotateBone("hips", 0, -0.04, 0.02);
    rotateBone("spine1", 0.02, 0.02, -0.01);
    rotateBone("head", -0.02, 0.05, 0);
    rotateBone("leftArm", baseArmX + 0.08, 0, 0);
    rotateBone("leftForeArm", 0.18, 0, 0.22);
    rotateBone("rightArm", baseArmX + 0.08, 0, 0);
    rotateBone("rightForeArm", -0.18, 0, -0.22);
  } else if (stance === "editorial_chic") {
    rotateBone("hips", 0, 0.08, -0.04);
    rotateBone("spine1", 0, -0.06, 0.02);
    rotateBone("head", 0.04, -0.08, 0.03);
    rotateBone("leftArm", baseArmX + 0.03, 0.05, 0);
    rotateBone("leftForeArm", 0.22, 0, 0.25);
    rotateBone("rightArm", baseArmX - 0.04, -0.05, 0);
    rotateBone("rightForeArm", -0.1, 0, -0.15);
  } else {
    // neutral_pose
    rotateBone("leftArm", baseArmX, 0, 0);
    rotateBone("rightArm", baseArmX, 0, 0);
    rotateBone("leftForeArm", 0.1, 0, 0.1);
    rotateBone("rightForeArm", -0.1, 0, -0.1);
  }

  const spine1StanceQuat = bones.spine1 ? bones.spine1.quaternion.clone() : undefined;
  return { spine1StanceQuat };
}

/**
 * Pure deterministic pipeline that modifies the skeleton bones based on
 * immutable baselines and validated multipliers.
 *
 * Implements counter-scaling across parent-child links:
 * - Hips -> Legs: Legs counter-scale to maintain natural diameter.
 * - Hips -> Spine: Spine compensates for Hips scale to isolate the waist.
 * - Spine -> Spine2: Spine2 compensates for waist to isolate the chest.
 * - Spine2 -> Neck: Neck compensates for chest to prevent head distortion.
 * - Spine2 -> Shoulders: Shoulders translate laterally and counter-scale to keep arms undistorted.
 */
export function applyAvatarTransformations(
  bones: ModelBones,
  baselines: SkeletonBaselines,
  params: BodyGeometryParams,
  options: { isFemale?: boolean } = {}
): { effectiveMultipliers: EffectiveMultipliers; spine1StanceQuat?: THREE.Quaternion } {
  const mults = calculateEffectiveMultipliers(params);
  const { shoulderWidth, waistScale, chestBust, hipWidth } = mults;

  const baseMap = baselines.bones;

  // 1. Reset all positions and scales to baseline
  Object.keys(baseMap).forEach((key) => {
    const b = bones[key];
    const base = baseMap[key];
    if (b && base) {
      b.position.copy(base.position);
      b.scale.copy(base.scale);
    }
  });

  // 2. Apply stance rotations
  const { spine1StanceQuat } = applyStanceRotations(
    bones,
    baselines,
    params.stance || "runway_confident",
    options.isFemale ?? true
  );

  // 3. Hips (Pelvis & Gluteal silhouette)
  const bHips = bones.hips;
  const baseHips = baseMap.hips;
  if (bHips && baseHips) {
    const hipZ = 1 + (hipWidth - 1) * 0.7;
    bHips.scale.set(
      baseHips.scale.x * hipWidth,
      baseHips.scale.y,
      baseHips.scale.z * hipZ
    );
  }

  // 4. Legs Counter-Scale (Thighs/Legs keep anatomical thickness)
  const bLeftUpLeg = bones.leftUpLeg;
  const bRightUpLeg = bones.rightUpLeg;
  const baseLeftUpLeg = baseMap.leftUpLeg;
  const baseRightUpLeg = baseMap.rightUpLeg;
  if (bLeftUpLeg && baseLeftUpLeg && bRightUpLeg && baseRightUpLeg) {
    const hipZ = 1 + (hipWidth - 1) * 0.7;
    bLeftUpLeg.scale.set(
      baseLeftUpLeg.scale.x / hipWidth,
      baseLeftUpLeg.scale.y,
      baseLeftUpLeg.scale.z / hipZ
    );
    bRightUpLeg.scale.set(
      baseRightUpLeg.scale.x / hipWidth,
      baseRightUpLeg.scale.y,
      baseRightUpLeg.scale.z / hipZ
    );
  }

  // 5. Spine (Waist Proportions): compensates for Hips scale
  const bSpine = bones.spine;
  const baseSpine = baseMap.spine;
  const bSpine1 = bones.spine1;
  const baseSpine1 = baseMap.spine1;
  if (bSpine && baseSpine) {
    const hipZ = 1 + (hipWidth - 1) * 0.7;
    const waistZ = 1 + (waistScale - 1) * 0.8;
    bSpine.scale.set(
      baseSpine.scale.x * (waistScale / hipWidth),
      baseSpine.scale.y,
      baseSpine.scale.z * (waistZ / hipZ)
    );
  }
  if (bSpine1 && baseSpine1) {
    bSpine1.scale.copy(baseSpine1.scale);
  }

  // 6. Spine2 (Chest Proportions): compensates for Spine & Hips scale
  const bSpine2 = bones.spine2;
  const baseSpine2 = baseMap.spine2;
  if (bSpine2 && baseSpine2) {
    const effectiveWaistX = waistScale;
    const effectiveWaistZ = 1 + (waistScale - 1) * 0.8;
    const chestZ = 1 + (chestBust - 1) * 0.8;

    bSpine2.scale.set(
      baseSpine2.scale.x * (chestBust / effectiveWaistX),
      baseSpine2.scale.y,
      baseSpine2.scale.z * (chestZ / effectiveWaistZ)
    );
  }

  // 7. Neck & Head Isolation: compensates for Spine2 scale
  const bNeck = bones.neck;
  const baseNeck = baseMap.neck;
  if (bNeck && baseNeck) {
    const chestZ = 1 + (chestBust - 1) * 0.8;
    bNeck.scale.set(
      baseNeck.scale.x / chestBust,
      baseNeck.scale.y,
      baseNeck.scale.z / chestZ
    );
  }

  // 8. Shoulders: Lateral Translation & Arm Scale Isolation
  const bLeftShoulder = bones.leftShoulder;
  const bRightShoulder = bones.rightShoulder;
  const baseLeftShoulder = baseMap.leftShoulder;
  const baseRightShoulder = baseMap.rightShoulder;

  if (bLeftShoulder && baseLeftShoulder && bRightShoulder && baseRightShoulder) {
    const chestZ = 1 + (chestBust - 1) * 0.8;

    // Lateral clavicle translation relative to baseline
    bLeftShoulder.position.x = baseLeftShoulder.position.x * shoulderWidth;
    bRightShoulder.position.x = baseRightShoulder.position.x * shoulderWidth;

    // Counter-scale so arms and hands keep baseline scale
    bLeftShoulder.scale.set(
      baseLeftShoulder.scale.x / chestBust,
      baseLeftShoulder.scale.y,
      baseLeftShoulder.scale.z / chestZ
    );
    bRightShoulder.scale.set(
      baseRightShoulder.scale.x / chestBust,
      baseRightShoulder.scale.y,
      baseRightShoulder.scale.z / chestZ
    );
  }

  // 9. Update world matrices across the entire hierarchy
  if (bones.hips) {
    bones.hips.updateWorldMatrix(true, true);
  }

  return { effectiveMultipliers: mults, spine1StanceQuat };
}

/**
 * Calculates floor anchoring position and scale parameters.
 * Guarantees the bottom of the model's feet remains fixed at groundY.
 */
export function calculateGroundAnchor(
  groundY: number = -1.12,
  heightScale: number = 1.0
): { pivotY: number; scaleY: number } {
  const clampedScale = Math.max(0.85, Math.min(1.20, heightScale));
  return {
    pivotY: groundY,
    scaleY: clampedScale,
  };
}
