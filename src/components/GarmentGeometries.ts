import * as THREE from "three";
import { createLatheProfile } from "./MannequinGeometries";

/**
 * Procedural 3D Atelier Garment Geometries
 * Tailored with radial offsets to drape organically over the anatomical mannequin.
 */

/* ==================== 1. TOPS ==================== */

/**
 * Minimalist Boxy Crewneck T-Shirt Torso Shell
 */
export function createTeeTorsoGeometry(): THREE.BufferGeometry {
  const extra = 0.022; // fabric margin over torso
  const profile: [number, number][] = [
    [0.001, 0.24],
    [0.17 + extra, 0.24], // relaxed crewneck opening
    [0.26 + extra, 0.18], // shoulder slope
    [0.28 + extra, 0.1], // chest breadth
    [0.265 + extra, -0.02], // ribcage drop
    [0.25 + extra, -0.16], // boxy waist (not tight)
    [0.255 + extra, -0.32], // dropped tee hem below waist
    [0.001, -0.32], // hem cap
  ];
  const geo = createLatheProfile(profile, 32);
  geo.scale(1.0, 1.0, 0.76);
  return geo;
}

/**
 * T-Shirt Short Sleeve (Upper Arm)
 */
export function createShortSleeveGeometry(): THREE.BufferGeometry {
  const extra = 0.022;
  const profile: [number, number][] = [
    [0.001, 0.2],
    [0.1 + extra, 0.2], // shoulder seam
    [0.098 + extra, 0.1], // mid bicep drape
    [0.094 + extra, 0.0], // sleeve opening above elbow
    [0.001, 0.0],
  ];
  const geo = createLatheProfile(profile, 20);
  geo.scale(0.98, 1.0, 1.06);
  return geo;
}

/**
 * Tailored Button-Down Shirt / Oversized Linen Shirt Torso
 */
export function createShirtTorsoGeometry(): THREE.BufferGeometry {
  const extra = 0.028;
  const profile: [number, number][] = [
    [0.001, 0.26],
    [0.15 + extra, 0.26], // collar stand
    [0.27 + extra, 0.19], // shoulder seam
    [0.29 + extra, 0.11], // chest
    [0.275 + extra, -0.02], // mid torso
    [0.26 + extra, -0.18], // waist
    [0.27 + extra, -0.36], // curved shirt hem
    [0.001, -0.36],
  ];
  const geo = createLatheProfile(profile, 32);
  geo.scale(1.0, 1.0, 0.78);
  return geo;
}

/**
 * Shirt Long Sleeve (Upper Arm + Forearm)
 */
export function createLongSleeveUpperGeometry(): THREE.BufferGeometry {
  const extra = 0.025;
  const profile: [number, number][] = [
    [0.001, 0.2],
    [0.1 + extra, 0.2],
    [0.096 + extra, 0.08],
    [0.088 + extra, -0.06],
    [0.082 + extra, -0.2], // elbow sleeve fullness
    [0.001, -0.2],
  ];
  const geo = createLatheProfile(profile, 20);
  geo.scale(0.98, 1.0, 1.05);
  return geo;
}

export function createLongSleeveForearmGeometry(): THREE.BufferGeometry {
  const extra = 0.024;
  const profile: [number, number][] = [
    [0.001, 0.18],
    [0.082 + extra, 0.18], // below elbow
    [0.086 + extra, 0.08], // forearm fullness
    [0.076 + extra, -0.04],
    [0.066 + extra, -0.16], // buttoned cuff
    [0.001, -0.16],
  ];
  const geo = createLatheProfile(profile, 20);
  geo.scale(0.95, 1.0, 1.0);
  return geo;
}

/**
 * Structured Blazer / Trench Coat Top
 */
export function createJacketTorsoGeometry(): THREE.BufferGeometry {
  const extra = 0.042;
  const profile: [number, number][] = [
    [0.001, 0.27],
    [0.16 + extra, 0.27], // lapel collar base
    [0.3 + extra, 0.2], // structured tailored shoulder pad
    [0.31 + extra, 0.1], // chest breadth
    [0.295 + extra, -0.04], // waist
    [0.3 + extra, -0.22], // jacket skirt
    [0.31 + extra, -0.42], // jacket dropped hem
    [0.001, -0.42],
  ];
  const geo = createLatheProfile(profile, 32);
  geo.scale(1.02, 1.0, 0.82);
  return geo;
}

/* ==================== 2. BOTTOMS ==================== */

/**
 * Pants Waistband & Pelvis Shell
 */
export function createPantsPelvisGeometry(): THREE.BufferGeometry {
  const extra = 0.024;
  const profile: [number, number][] = [
    [0.001, 0.18],
    [0.205 + extra, 0.18], // tailored high waist
    [0.245 + extra, 0.08], // hip flare
    [0.265 + extra, -0.04], // gluteal breadth
    [0.23 + extra, -0.14], // crotch taper
    [0.17 + extra, -0.22], // leg fork
    [0.001, -0.22],
  ];
  const geo = createLatheProfile(profile, 28);
  geo.scale(1.0, 1.0, 0.84);
  return geo;
}

/**
 * Straight Trousers / Jeans - Thigh & Calf
 */
export function createStraightPantsThighGeometry(): THREE.BufferGeometry {
  const extra = 0.024;
  const profile: [number, number][] = [
    [0.001, 0.28],
    [0.135 + extra, 0.28], // hip/crotch seam
    [0.138 + extra, 0.16], // upper thigh
    [0.128 + extra, 0.02], // mid thigh
    [0.115 + extra, -0.14], // above knee
    [0.108 + extra, -0.28], // over knee
    [0.001, -0.28],
  ];
  const geo = createLatheProfile(profile, 24);
  geo.scale(0.98, 1.0, 1.06);
  return geo;
}

export function createStraightPantsCalfGeometry(): THREE.BufferGeometry {
  const extra = 0.022;
  const profile: [number, number][] = [
    [0.001, 0.26],
    [0.108 + extra, 0.26], // below knee
    [0.112 + extra, 0.14], // calf drape
    [0.104 + extra, 0.0], // mid calf
    [0.095 + extra, -0.14], // lower calf
    [0.092 + extra, -0.26], // ankle hem break
    [0.001, -0.26],
  ];
  const geo = createLatheProfile(profile, 24);
  geo.scale(0.96, 1.0, 1.06);
  return geo;
}

/**
 * Pleated Wide-Leg Chinos - Thigh & Calf (Relaxed Runway Drape)
 */
export function createWidePantsThighGeometry(): THREE.BufferGeometry {
  const extra = 0.04;
  const profile: [number, number][] = [
    [0.001, 0.28],
    [0.152 + extra, 0.28], // deep pleat volume
    [0.15 + extra, 0.14],
    [0.145 + extra, -0.02],
    [0.142 + extra, -0.16],
    [0.14 + extra, -0.28], // relaxed knee
    [0.001, -0.28],
  ];
  const geo = createLatheProfile(profile, 24);
  geo.scale(1.0, 1.0, 1.05);
  return geo;
}

export function createWidePantsCalfGeometry(): THREE.BufferGeometry {
  const extra = 0.038;
  const profile: [number, number][] = [
    [0.001, 0.26],
    [0.14 + extra, 0.26],
    [0.138 + extra, 0.12],
    [0.136 + extra, -0.02],
    [0.134 + extra, -0.16],
    [0.132 + extra, -0.26], // wide hem pooling at shoe
    [0.001, -0.26],
  ];
  const geo = createLatheProfile(profile, 24);
  geo.scale(1.0, 1.0, 1.05);
  return geo;
}

/**
 * Tailored Shorts (Thigh only)
 */
export function createShortsThighGeometry(): THREE.BufferGeometry {
  const extra = 0.028;
  const profile: [number, number][] = [
    [0.001, 0.28],
    [0.14 + extra, 0.28],
    [0.14 + extra, 0.14],
    [0.136 + extra, 0.0],
    [0.134 + extra, -0.1], // shorts hem mid-thigh
    [0.001, -0.1],
  ];
  const geo = createLatheProfile(profile, 24);
  geo.scale(0.98, 1.0, 1.05);
  return geo;
}

/* ==================== 3. FOOTWEAR ==================== */

/**
 * Minimalist Chunky White Sneakers
 */
export function createSneakerGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.108, 0.082, 0.24, 2, 2, 4);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Sculpt curved toe box and instep
    if (z > 0.04) {
      pos.setX(i, pos.getX(i) * (1 - z * 0.9));
      if (y > 0) {
        pos.setY(i, pos.getY(i) * (1 - z * 0.7)); // curved vamp
      }
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sneaker Sole Rim (Platform Accent)
 */
export function createSneakerSoleGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.114, 0.03, 0.248, 2, 1, 4);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    if (z > 0.04) {
      pos.setX(i, pos.getX(i) * (1 - z * 0.85));
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Polished Leather Loafers
 */
export function createLoaferGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.1, 0.072, 0.235, 2, 2, 4);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Sleek almond toe taper
    if (z > 0.02) {
      pos.setX(i, pos.getX(i) * (1 - z * 1.25));
      if (y > 0) {
        pos.setY(i, pos.getY(i) * (1 - z * 1.05));
      }
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/* ==================== 4. MODULAR RIGGED 3D ATELIER ACCENTS ==================== */

/**
 * Oxford Button-Down Shirt 3D Accents
 * Attaches to Spine2 (chest) to provide structured collar leaves, front placket, and pearl buttons.
 */
export function createShirtAccentsGroup(shirtMat: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = "ModularShirtAccents";

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.18,
    metalness: 0.08,
  });

  // 1. Neck Collar Leaves (Left & Right)
  const leafGeo = new THREE.BoxGeometry(0.036, 0.068, 0.007);
  leafGeo.rotateX(0.15);

  const leftLeaf = new THREE.Mesh(leafGeo, shirtMat);
  leftLeaf.position.set(-0.048, 0.17, 0.082);
  leftLeaf.rotation.set(0.12, 0.42, -0.32);
  leftLeaf.castShadow = true;
  group.add(leftLeaf);

  const rightLeaf = new THREE.Mesh(leafGeo, shirtMat);
  rightLeaf.position.set(0.048, 0.17, 0.082);
  rightLeaf.rotation.set(0.12, -0.42, 0.32);
  rightLeaf.castShadow = true;
  group.add(rightLeaf);

  // 2. Front Button Placket Strip
  const placketGeo = new THREE.BoxGeometry(0.018, 0.29, 0.005);
  const placket = new THREE.Mesh(placketGeo, shirtMat);
  placket.position.set(0, 0.025, 0.096);
  placket.castShadow = true;
  group.add(placket);

  // 3. Lustrous Pearl Buttons along Placket
  const buttonGeo = new THREE.CylinderGeometry(0.0038, 0.0038, 0.0024, 16);
  buttonGeo.rotateX(Math.PI * 0.5);

  const buttonYs = [0.12, 0.06, 0.0, -0.06, -0.12];
  buttonYs.forEach((by) => {
    const btn = new THREE.Mesh(buttonGeo, buttonMat);
    btn.position.set(0, by, 0.099);
    btn.castShadow = true;
    group.add(btn);
  });

  return group;
}

/**
 * Tailored Blazer / Suit Jacket 3D Accents
 * Attaches to Spine2 (chest) to provide structured notch lapels, welt chest pocket, and closure button.
 */
export function createJacketAccentsGroup(jacketMat: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = "ModularJacketAccents";

  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x18181c,
    roughness: 0.25,
    metalness: 0.65, // Metallic rim button
  });

  // 1. Structured Notch Lapels (Left & Right)
  const lapelGeo = new THREE.BoxGeometry(0.044, 0.24, 0.009);

  const leftLapel = new THREE.Mesh(lapelGeo, jacketMat);
  leftLapel.position.set(-0.058, 0.075, 0.102);
  leftLapel.rotation.set(0.08, 0.35, -0.22);
  leftLapel.castShadow = true;
  group.add(leftLapel);

  const rightLapel = new THREE.Mesh(lapelGeo, jacketMat);
  rightLapel.position.set(0.058, 0.075, 0.102);
  rightLapel.rotation.set(0.08, -0.35, 0.22);
  rightLapel.castShadow = true;
  group.add(rightLapel);

  // 2. Welt Chest Pocket on Left Breast
  const pocketGeo = new THREE.BoxGeometry(0.046, 0.009, 0.006);
  const pocket = new THREE.Mesh(pocketGeo, jacketMat);
  pocket.position.set(-0.072, 0.115, 0.106);
  pocket.rotation.set(0, 0.32, 0.06);
  pocket.castShadow = true;
  group.add(pocket);

  // 3. Central Closure Horn Button
  const btnGeo = new THREE.CylinderGeometry(0.0065, 0.0065, 0.0035, 18);
  btnGeo.rotateX(Math.PI * 0.5);
  const button = new THREE.Mesh(btnGeo, buttonMat);
  button.position.set(0, -0.075, 0.101);
  button.castShadow = true;
  group.add(button);

  return group;
}

/**
 * Tailored Folded Shorts Cuff
 * Attaches to LeftUpLeg / RightUpLeg to form an architectural folded cuff right above the knee.
 */
export function createShortsCuffGroup(pantsMat: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = "ModularShortsCuff";

  const cuffGeo = new THREE.CylinderGeometry(0.082, 0.086, 0.038, 28, 1, true);
  cuffGeo.scale(1.0, 1.0, 1.08); // Slight oval to match thigh anatomy
  const cuff = new THREE.Mesh(cuffGeo, pantsMat);
  cuff.castShadow = true;
  group.add(cuff);

  // Folded hem rim accent
  const rimGeo = new THREE.TorusGeometry(0.084, 0.007, 12, 28);
  rimGeo.scale(1.0, 1.0, 1.08);
  rimGeo.rotateX(Math.PI * 0.5);
  rimGeo.translate(0, -0.016, 0);
  const rim = new THREE.Mesh(rimGeo, pantsMat);
  rim.castShadow = true;
  group.add(rim);

  return group;
}

/**
 * Minimalist Luxury Sneaker Platform Accent
 * Attaches to Foot bone to provide crisp contrasting platform cupsole and laces.
 */
export function createSneakerAccentsGroup(
  shoesMat: THREE.Material,
  soleColorHex: string = "#FAFAFA",
): THREE.Group {
  const group = new THREE.Group();
  group.name = "ModularSneakerAccents";

  const soleMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(soleColorHex),
    roughness: 0.82,
    metalness: 0.02,
  });

  // Outsole cupsole platform
  const soleGeo = createSneakerSoleGeometry();
  const sole = new THREE.Mesh(soleGeo, soleMat);
  sole.position.set(0, -0.008, 0.032);
  sole.castShadow = true;
  sole.receiveShadow = true;
  group.add(sole);

  // Instep lacing eyelet rows
  const eyeletGeo = new THREE.BoxGeometry(0.048, 0.005, 0.006);
  [-0.015, 0.015, 0.045].forEach((lz) => {
    const lace = new THREE.Mesh(eyeletGeo, soleMat);
    lace.position.set(0, 0.052, lz);
    lace.castShadow = true;
    group.add(lace);
  });

  return group;
}

/**
 * Polished Penny Loafer Saddle Accent
 * Attaches to Foot bone to provide almond toe shaping, leather saddle strap, and penny cutout.
 */
export function createLoaferAccentsGroup(shoesMat: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = "ModularLoaferAccents";

  const strapMat = (shoesMat as THREE.MeshStandardMaterial).clone();
  strapMat.roughness = 0.28;
  strapMat.metalness = 0.12;

  // 1. Penny Saddle Strap across instep
  const strapGeo = new THREE.BoxGeometry(0.088, 0.018, 0.022);
  const strap = new THREE.Mesh(strapGeo, strapMat);
  strap.position.set(0, 0.042, 0.025);
  strap.rotation.set(-0.18, 0, 0);
  strap.castShadow = true;
  group.add(strap);

  // 2. Penny Cutout Diamond Slot
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.9 });
  const slotGeo = new THREE.BoxGeometry(0.022, 0.008, 0.024);
  const slot = new THREE.Mesh(slotGeo, slotMat);
  slot.position.set(0, 0.043, 0.025);
  slot.rotation.set(-0.18, 0, 0);
  group.add(slot);

  // 3. Low Stacked Leather Heel Block
  const heelGeo = new THREE.BoxGeometry(0.076, 0.016, 0.065);
  const heel = new THREE.Mesh(heelGeo, strapMat);
  heel.position.set(0, -0.016, -0.045);
  heel.castShadow = true;
  group.add(heel);

  return group;
}
