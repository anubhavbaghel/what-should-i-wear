/**
 * avatar-transform.test.ts
 *
 * Automated tests for avatar transformation pipeline.
 * Run with: node --test src/lib/avatar-transform.test.ts
 */

import test from "node:test";
import assert from "node:assert";
import * as THREE from "three";
import {
  captureSkeletonBaselines,
  applyAvatarTransformations,
  calculateEffectiveMultipliers,
  calculateGroundAnchor,
  PRESET_BASE_MULTIPLIERS,
} from "./avatar-transform.ts";
import type {
  ModelBones,
  SkeletonBaselines,
} from "./avatar-transform.ts";
import type { BodyFrameType } from "./avatar.types.ts";

/**
 * Creates a mock skeleton mimicking the female and male GLB hierarchies.
 */
function createMockSkeleton(isFemale: boolean = true) {
  const root = new THREE.Group();
  root.name = "Armature";

  const hips = new THREE.Bone(); hips.name = "Hips";
  const spine = new THREE.Bone(); spine.name = "Spine";
  const spine1 = new THREE.Bone(); spine1.name = "Spine1";
  const spine2 = new THREE.Bone(); spine2.name = "Spine2";
  const neck = new THREE.Bone(); neck.name = "Neck";
  const head = new THREE.Bone(); head.name = "Head";
  const leftShoulder = new THREE.Bone(); leftShoulder.name = "LeftShoulder";
  const rightShoulder = new THREE.Bone(); rightShoulder.name = "RightShoulder";
  const leftArm = new THREE.Bone(); leftArm.name = "LeftArm";
  const rightArm = new THREE.Bone(); rightArm.name = "RightArm";
  const leftForeArm = new THREE.Bone(); leftForeArm.name = "LeftForeArm";
  const rightForeArm = new THREE.Bone(); rightForeArm.name = "RightForeArm";
  const leftUpLeg = new THREE.Bone(); leftUpLeg.name = "LeftUpLeg";
  const rightUpLeg = new THREE.Bone(); rightUpLeg.name = "RightUpLeg";
  const leftLeg = new THREE.Bone(); leftLeg.name = "LeftLeg";
  const rightLeg = new THREE.Bone(); rightLeg.name = "RightLeg";

  root.add(hips);
  hips.add(spine);
  hips.add(leftUpLeg);
  hips.add(rightUpLeg);
  spine.add(spine1);
  spine1.add(spine2);
  spine2.add(neck);
  neck.add(head);
  spine2.add(leftShoulder);
  spine2.add(rightShoulder);
  leftShoulder.add(leftArm);
  leftArm.add(leftForeArm);
  rightShoulder.add(rightArm);
  rightArm.add(rightForeArm);
  leftUpLeg.add(leftLeg);
  rightUpLeg.add(rightLeg);

  // Set realistic bind-pose coordinates
  const shoulderX = isFemale ? 0.0622 : 0.0471;
  const legX = 0.0954;

  hips.position.set(0, 1.02, 0.01);
  spine.position.set(0, 0.098, 0);
  spine1.position.set(0, 0.12, 0);
  spine2.position.set(0, 0.12, 0);
  neck.position.set(0, 0.14, 0);
  head.position.set(0, 0.10, 0);

  leftShoulder.position.set(shoulderX, 0.11, -0.01);
  rightShoulder.position.set(-shoulderX, 0.11, -0.01);
  leftArm.position.set(0, 0.07, 0);
  rightArm.position.set(0, 0.07, 0);

  leftUpLeg.position.set(legX, 0, 0);
  rightUpLeg.position.set(-legX, 0, 0);

  root.updateWorldMatrix(true, true);

  return root;
}

test("1. Baseline Management: Captures uncorrupted immutable baselines", () => {
  const root = createMockSkeleton(true);
  const { bones, baselines } = captureSkeletonBaselines(root, "female-twin.glb");

  assert.ok(bones.hips);
  assert.ok(bones.leftShoulder);
  assert.ok(bones.rightShoulder);
  assert.ok(bones.neck);
  assert.ok(bones.head);
  assert.ok(baselines.bones.leftShoulder);

  const initialShoulderX = baselines.bones.leftShoulder.position.x;
  assert.strictEqual(initialShoulderX, 0.0622);

  // Mutate bone directly
  bones.leftShoulder!.position.x = 999;
  // Verify baseline is immutable
  assert.strictEqual(baselines.bones.leftShoulder.position.x, 0.0622);
});

test("2. Determinism: Applying identical configuration twice produces identical transforms", () => {
  const root = createMockSkeleton(true);
  const { bones, baselines } = captureSkeletonBaselines(root, "female-twin.glb");

  const config = {
    bodyFrame: "athletic" as BodyFrameType,
    shoulderPct: 65,
    waistPct: 40,
  };

  applyAvatarTransformations(bones, baselines, config);
  const firstShoulderPos = bones.leftShoulder!.position.clone();
  const firstSpineScale = bones.spine!.scale.clone();
  const firstHipsScale = bones.hips!.scale.clone();

  // Re-apply
  applyAvatarTransformations(bones, baselines, config);
  const secondShoulderPos = bones.leftShoulder!.position.clone();
  const secondSpineScale = bones.spine!.scale.clone();
  const secondHipsScale = bones.hips!.scale.clone();

  assert.strictEqual(firstShoulderPos.x, secondShoulderPos.x);
  assert.strictEqual(firstSpineScale.x, secondSpineScale.x);
  assert.strictEqual(firstHipsScale.x, secondHipsScale.x);
});

test("3. No Cumulative Drift: 100 alternating slider adjustments match single baseline application", () => {
  const root = createMockSkeleton(true);
  const { bones, baselines } = captureSkeletonBaselines(root, "female-twin.glb");

  // 100 alternating operations
  for (let i = 0; i < 100; i++) {
    const shoulderPct = i % 2 === 0 ? 15 : 85;
    const waistPct = i % 2 === 0 ? 85 : 15;
    applyAvatarTransformations(bones, baselines, { shoulderPct, waistPct });
  }

  // Final configuration: 70% shoulders, 35% waist
  const finalConfig = { shoulderPct: 70, waistPct: 35 };
  applyAvatarTransformations(bones, baselines, finalConfig);
  const loopedResultPos = bones.leftShoulder!.position.clone();
  const loopedResultScale = bones.spine!.scale.clone();

  // Fresh model with direct application
  const freshRoot = createMockSkeleton(true);
  const fresh = captureSkeletonBaselines(freshRoot, "female-twin.glb");
  applyAvatarTransformations(fresh.bones, fresh.baselines, finalConfig);
  const directResultPos = fresh.bones.leftShoulder!.position.clone();
  const directResultScale = fresh.bones.spine!.scale.clone();

  const posDiff = Math.abs(loopedResultPos.x - directResultPos.x);
  const scaleDiff = Math.abs(loopedResultScale.x - directResultScale.x);

  assert.ok(posDiff < 1e-7, `Position drift too large: ${posDiff}`);
  assert.ok(scaleDiff < 1e-7, `Scale drift too large: ${scaleDiff}`);
});

test("4. Reset: Customizing all parameters and resetting restores exact original transforms", () => {
  const root = createMockSkeleton(true);
  const { bones, baselines } = captureSkeletonBaselines(root, "female-twin.glb");

  const originalShoulderX = baselines.bones.leftShoulder.position.x;
  const originalHipsScaleX = baselines.bones.hips.scale.x;

  // Heavy customization
  applyAvatarTransformations(bones, baselines, {
    bodyFrame: "curvy",
    shoulderPct: 85,
    waistPct: 20,
    bodyMorphs: {
      shoulderWidth: 1.25,
      waistScale: 0.8,
      hipWidth: 1.25,
      chestBust: 1.2,
    },
  });

  // Verify it changed
  assert.notStrictEqual(bones.leftShoulder!.position.x, originalShoulderX);

  // Reset to neutral average
  applyAvatarTransformations(bones, baselines, {
    bodyFrame: "average",
    shoulderPct: 50,
    waistPct: 50,
    bodyMorphs: {
      shoulderWidth: 1.0,
      waistScale: 1.0,
      hipWidth: 1.0,
      chestBust: 1.0,
    },
  });

  const shoulderDiff = Math.abs(bones.leftShoulder!.position.x - originalShoulderX);
  const hipsDiff = Math.abs(bones.hips!.scale.x - originalHipsScaleX);

  assert.ok(shoulderDiff < 1e-6, `Shoulder did not reset cleanly: diff = ${shoulderDiff}`);
  assert.ok(hipsDiff < 1e-6, `Hips did not reset cleanly: diff = ${hipsDiff}`);
});

test("5. Preset Transitions: Switching between all presets derives cleanly from baseline", () => {
  const root = createMockSkeleton(true);
  const { bones, baselines } = captureSkeletonBaselines(root, "female-twin.glb");

  const presets: BodyFrameType[] = ["slim", "athletic", "curvy", "average"];

  for (const p of presets) {
    const { effectiveMultipliers } = applyAvatarTransformations(bones, baselines, { bodyFrame: p });
    const expected = PRESET_BASE_MULTIPLIERS[p];

    assert.strictEqual(effectiveMultipliers.shoulderWidth, expected.shoulderWidth);
    assert.strictEqual(effectiveMultipliers.waistScale, expected.waistScale);
    assert.strictEqual(effectiveMultipliers.hipWidth, expected.hipWidth);
  }
});

test("6. Model Independence: Female and Male models use distinct baselines without cross-contamination", () => {
  const femaleRoot = createMockSkeleton(true);
  const female = captureSkeletonBaselines(femaleRoot, "female-twin.glb");

  const maleRoot = createMockSkeleton(false);
  const male = captureSkeletonBaselines(maleRoot, "male-twin.glb");

  assert.strictEqual(female.baselines.bones.leftShoulder.position.x, 0.0622);
  assert.strictEqual(male.baselines.bones.leftShoulder.position.x, 0.0471);

  // Customizing female must not affect male
  applyAvatarTransformations(female.bones, female.baselines, { bodyFrame: "athletic" }, { isFemale: true });
  assert.strictEqual(male.bones.leftShoulder!.position.x, 0.0471);

  // Customizing male
  applyAvatarTransformations(male.bones, male.baselines, { bodyFrame: "slim" }, { isFemale: false });
  assert.ok(male.bones.leftShoulder!.position.x < 0.0471);
});

test("7. Anatomical Isolation: Head, Neck, Arms, and Legs maintain un-deformed world scales", () => {
  const root = createMockSkeleton(true);
  const { bones, baselines } = captureSkeletonBaselines(root, "female-twin.glb");

  // Extreme athletic torso & wide curvy hips
  applyAvatarTransformations(bones, baselines, {
    bodyMorphs: {
      hipWidth: 1.25,
      waistScale: 0.85,
      chestBust: 1.20,
      shoulderWidth: 1.20,
    },
  });

  const vHead = new THREE.Vector3();
  const vArm = new THREE.Vector3();
  const vLeg = new THREE.Vector3();

  bones.head!.getWorldScale(vHead);
  bones.leftArm!.getWorldScale(vArm);
  bones.leftLeg!.getWorldScale(vLeg);

  // World scales for head, arm, and leg should be [1, 1, 1] within rotation-coupling tolerance (< 0.1%)
  assert.ok(Math.abs(vHead.x - 1.0) < 1e-3, `Head deformed in X: ${vHead.x}`);
  assert.ok(Math.abs(vHead.z - 1.0) < 1e-3, `Head deformed in Z: ${vHead.z}`);
  assert.ok(Math.abs(vArm.x - 1.0) < 1e-3, `Arm deformed in X: ${vArm.x}`);
  assert.ok(Math.abs(vArm.z - 1.0) < 1e-3, `Arm deformed in Z: ${vArm.z}`);
  assert.ok(Math.abs(vLeg.x - 1.0) < 1e-3, `Leg deformed in X: ${vLeg.x}`);
  assert.ok(Math.abs(vLeg.z - 1.0) < 1e-3, `Leg deformed in Z: ${vLeg.z}`);
});

test("8. Input Validation: Out-of-bounds parameters are safely clamped", () => {
  const params = calculateEffectiveMultipliers({
    shoulderPct: 9999,
    waistPct: -9999,
    heightCm: 500,
    bodyMorphs: {
      shoulderWidth: 5.0,
      waistScale: 0.1,
    },
  });

  assert.ok(params.shoulderWidth <= 1.25);
  assert.ok(params.waistScale >= 0.78);
  assert.ok(params.heightScale <= 1.20);
});

test("9. Floor Ground Anchor: Feet contact remains pinned to ground plane across height variations", () => {
  const groundY = -1.12;

  const anchor150 = calculateGroundAnchor(groundY, 150 / 170);
  const anchor170 = calculateGroundAnchor(groundY, 170 / 170);
  const anchor195 = calculateGroundAnchor(groundY, 195 / 170);

  assert.strictEqual(anchor150.pivotY, -1.12);
  assert.strictEqual(anchor170.pivotY, -1.12);
  assert.strictEqual(anchor195.pivotY, -1.12);

  assert.ok(anchor150.scaleY < 1.0);
  assert.strictEqual(anchor170.scaleY, 1.0);
  assert.ok(anchor195.scaleY > 1.0);
});

test("10. Configuration Restoration: Saved body config applied to freshly loaded model produces exact result", () => {
  const savedConfig = {
    bodyFrame: "curvy" as BodyFrameType,
    shoulderPct: 75,
    waistPct: 35,
    heightCm: 180,
    stance: "editorial_chic" as const,
  };

  // Session A
  const rootA = createMockSkeleton(true);
  const sessionA = captureSkeletonBaselines(rootA, "female-twin.glb");
  applyAvatarTransformations(sessionA.bones, sessionA.baselines, savedConfig);
  const posA = sessionA.bones.leftShoulder!.position.clone();
  const scaleA = sessionA.bones.spine!.scale.clone();
  const quatA = sessionA.bones.leftArm!.quaternion.clone();

  // Session B (Fresh model loaded later)
  const rootB = createMockSkeleton(true);
  const sessionB = captureSkeletonBaselines(rootB, "female-twin.glb");
  applyAvatarTransformations(sessionB.bones, sessionB.baselines, savedConfig);
  const posB = sessionB.bones.leftShoulder!.position.clone();
  const scaleB = sessionB.bones.spine!.scale.clone();
  const quatB = sessionB.bones.leftArm!.quaternion.clone();

  assert.strictEqual(posA.x, posB.x);
  assert.strictEqual(scaleA.x, scaleB.x);
  assert.strictEqual(quatA.x, quatB.x);
  assert.strictEqual(quatA.y, quatB.y);
  assert.strictEqual(quatA.z, quatB.z);
  assert.strictEqual(quatA.w, quatB.w);
});
