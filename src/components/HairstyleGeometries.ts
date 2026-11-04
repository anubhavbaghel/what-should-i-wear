import * as THREE from "three";

export type HairstyleType =
  | "none"
  | "fade"
  | "wavy_curtains"
  | "sleek_bob"
  | "high_ponytail"
  | "afro_curls"
  | "chic_beanie"
  | "buzz_cut"
  | "short_textured"
  | "curly_high_top"
  | "center_part_bob"
  | "long_waves";

export type EyewearType = "none" | "designer_sunglasses" | "wire_frames";

export interface HairMaterialConfig {
  colorHex: string;
  roughness?: number;
  metalness?: number;
}

export function createHairMaterial(config: HairMaterialConfig): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.colorHex),
    roughness: config.roughness ?? 0.72,
    metalness: config.metalness ?? 0.08,
    side: THREE.FrontSide,
  });
}

/**
 * Creates 3D procedural stylish hairstyles anchored to head origin (0, 0, 0)
 * where (0, 0, 0) is the center of the head, Y+ is up, Z+ is front facing.
 */

// 1. Textured Crop & Taper Fade
export function createFadeHairGeometry(): THREE.BufferGeometry {
  const groupGeo = new THREE.BufferGeometry();
  // Skull cap top volume
  const cap = new THREE.SphereGeometry(0.124, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.58);
  cap.scale(1.0, 1.15, 1.12);
  cap.translate(0, 0.015, -0.01);
  return cap;
}

// 2. Wavy Curtain Bangs / Flow
export function createWavyCurtainsHair(mat: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  // Top Cap
  const capGeo = new THREE.SphereGeometry(0.126, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
  capGeo.scale(1.02, 1.18, 1.14);
  capGeo.translate(0, 0.015, -0.01);
  const cap = new THREE.Mesh(capGeo, mat);
  cap.castShadow = true;
  group.add(cap);

  // Left Curtain Flow
  const leftBangs = new THREE.CylinderGeometry(0.045, 0.03, 0.16, 16);
  leftBangs.rotateZ(0.25);
  leftBangs.rotateY(-0.2);
  leftBangs.scale(0.8, 1.1, 0.6);
  leftBangs.translate(-0.085, 0.02, 0.07);
  const leftMesh = new THREE.Mesh(leftBangs, mat);
  leftMesh.castShadow = true;
  group.add(leftMesh);

  // Right Curtain Flow
  const rightBangs = new THREE.CylinderGeometry(0.045, 0.03, 0.16, 16);
  rightBangs.rotateZ(-0.25);
  rightBangs.rotateY(0.2);
  rightBangs.scale(0.8, 1.1, 0.6);
  rightBangs.translate(0.085, 0.02, 0.07);
  const rightMesh = new THREE.Mesh(rightBangs, mat);
  rightMesh.castShadow = true;
  group.add(rightMesh);

  // Back flow
  const backGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.14, 20, 1, false, 0, Math.PI);
  backGeo.rotateY(Math.PI * 0.5);
  backGeo.translate(0, -0.04, -0.06);
  const backMesh = new THREE.Mesh(backGeo, mat);
  backMesh.castShadow = true;
  group.add(backMesh);

  return group;
}

// 3. Modern Sleek Editorial Bob
export function createSleekBobHair(mat: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  // Dome cap
  const domeGeo = new THREE.SphereGeometry(0.128, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.55);
  domeGeo.scale(1.04, 1.2, 1.15);
  domeGeo.translate(0, 0.018, -0.01);
  const dome = new THREE.Mesh(domeGeo, mat);
  dome.castShadow = true;
  group.add(dome);

  // Bob Sides Curtains
  const sidesGeo = new THREE.CylinderGeometry(
    0.132,
    0.14,
    0.22,
    24,
    1,
    true,
    Math.PI * 0.25,
    Math.PI * 1.5,
  );
  sidesGeo.scale(1.0, 1.0, 1.08);
  sidesGeo.translate(0, -0.06, -0.015);
  const sides = new THREE.Mesh(sidesGeo, mat);
  sides.castShadow = true;
  group.add(sides);

  return group;
}

// 4. High-Fashion Ponytail
export function createHighPonytailHair(mat: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  // Pulled back tight base
  const sleekBaseGeo = new THREE.SphereGeometry(0.124, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.65);
  sleekBaseGeo.scale(1.0, 1.15, 1.12);
  sleekBaseGeo.translate(0, 0.01, -0.01);
  const sleekBase = new THREE.Mesh(sleekBaseGeo, mat);
  sleekBase.castShadow = true;
  group.add(sleekBase);

  // Hair tie scrunchie
  const tieGeo = new THREE.TorusGeometry(0.024, 0.01, 12, 24);
  const tieMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const tie = new THREE.Mesh(tieGeo, tieMat);
  tie.rotation.x = Math.PI * 0.35;
  tie.position.set(0, 0.12, -0.11);
  group.add(tie);

  // Ponytail plume
  const plumeGeo = new THREE.ConeGeometry(0.05, 0.32, 16);
  plumeGeo.rotateX(Math.PI * 0.38);
  plumeGeo.scale(0.85, 1.0, 1.1);
  plumeGeo.translate(0, 0.02, -0.22);
  const plume = new THREE.Mesh(plumeGeo, mat);
  plume.castShadow = true;
  group.add(plume);

  return group;
}

// 5. Sculpted Afro Curls
export function createAfroCurlsHair(mat: THREE.Material): THREE.Group {
  const group = new THREE.Group();

  // Voluminous halo spheres
  const mainHaloGeo = new THREE.SphereGeometry(0.155, 24, 20);
  mainHaloGeo.scale(1.08, 1.18, 1.08);
  mainHaloGeo.translate(0, 0.04, -0.01);
  const mainHalo = new THREE.Mesh(mainHaloGeo, mat);
  mainHalo.castShadow = true;
  group.add(mainHalo);

  return group;
}

// 6. Streetwear Knit Beanie
export function createChicBeanie(colorHex: string = "#1E2024"): THREE.Group {
  const group = new THREE.Group();
  const beanieMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.9,
    metalness: 0.02,
  });

  // Beanie Dome
  const domeGeo = new THREE.SphereGeometry(0.134, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.6);
  domeGeo.scale(1.05, 1.35, 1.15);
  domeGeo.translate(0, 0.035, -0.02);
  const dome = new THREE.Mesh(domeGeo, beanieMat);
  dome.castShadow = true;
  group.add(dome);

  // Beanie Fold Rim
  const rimGeo = new THREE.TorusGeometry(0.125, 0.022, 16, 32);
  rimGeo.scale(1.0, 1.0, 1.12);
  rimGeo.rotateX(Math.PI * 0.5);
  rimGeo.translate(0, 0.03, -0.01);
  const rim = new THREE.Mesh(rimGeo, beanieMat);
  rim.castShadow = true;
  group.add(rim);

  return group;
}

// 7. Designer Acetate Sunglasses
export function createDesignerSunglasses(): THREE.Group {
  const group = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#121214"),
    roughness: 0.15,
    metalness: 0.4,
  });

  const lensMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#050508"),
    roughness: 0.05,
    metalness: 0.9,
    transmission: 0.5,
    thickness: 0.01,
  });

  // Left Frame
  const frameGeo = new THREE.TorusGeometry(0.028, 0.005, 12, 24);
  frameGeo.scale(1.2, 0.9, 1.0);
  const leftFrame = new THREE.Mesh(frameGeo, frameMat);
  leftFrame.position.set(-0.042, 0.01, 0.12);
  group.add(leftFrame);

  // Left Lens
  const lensGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.003, 20);
  lensGeo.rotateX(Math.PI * 0.5);
  lensGeo.scale(1.15, 0.85, 1.0);
  const leftLens = new THREE.Mesh(lensGeo, lensMat);
  leftLens.position.set(-0.042, 0.01, 0.12);
  group.add(leftLens);

  // Right Frame
  const rightFrame = leftFrame.clone();
  rightFrame.position.x = 0.042;
  group.add(rightFrame);

  // Right Lens
  const rightLens = leftLens.clone();
  rightLens.position.x = 0.042;
  group.add(rightLens);

  // Bridge
  const bridgeGeo = new THREE.BoxGeometry(0.022, 0.004, 0.005);
  const bridge = new THREE.Mesh(bridgeGeo, frameMat);
  bridge.position.set(0, 0.012, 0.12);
  group.add(bridge);

  // Temples (Arms)
  const armGeo = new THREE.BoxGeometry(0.004, 0.005, 0.12);
  const leftArm = new THREE.Mesh(armGeo, frameMat);
  leftArm.position.set(-0.075, 0.012, 0.06);
  group.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.075;
  group.add(rightArm);

  return group;
}
