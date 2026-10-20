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
    [0.17 + extra, 0.24],      // relaxed crewneck opening
    [0.26 + extra, 0.18],      // shoulder slope
    [0.28 + extra, 0.10],      // chest breadth
    [0.265 + extra, -0.02],    // ribcage drop
    [0.25 + extra, -0.16],     // boxy waist (not tight)
    [0.255 + extra, -0.32],    // dropped tee hem below waist
    [0.001, -0.32],            // hem cap
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
    [0.001, 0.20],
    [0.10 + extra, 0.20],     // shoulder seam
    [0.098 + extra, 0.10],    // mid bicep drape
    [0.094 + extra, 0.00],    // sleeve opening above elbow
    [0.001, 0.00],
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
    [0.15 + extra, 0.26],      // collar stand
    [0.27 + extra, 0.19],      // shoulder seam
    [0.29 + extra, 0.11],      // chest
    [0.275 + extra, -0.02],    // mid torso
    [0.26 + extra, -0.18],     // waist
    [0.27 + extra, -0.36],     // curved shirt hem
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
    [0.001, 0.20],
    [0.10 + extra, 0.20],
    [0.096 + extra, 0.08],
    [0.088 + extra, -0.06],
    [0.082 + extra, -0.20],    // elbow sleeve fullness
    [0.001, -0.20],
  ];
  const geo = createLatheProfile(profile, 20);
  geo.scale(0.98, 1.0, 1.05);
  return geo;
}

export function createLongSleeveForearmGeometry(): THREE.BufferGeometry {
  const extra = 0.024;
  const profile: [number, number][] = [
    [0.001, 0.18],
    [0.082 + extra, 0.18],     // below elbow
    [0.086 + extra, 0.08],     // forearm fullness
    [0.076 + extra, -0.04],
    [0.066 + extra, -0.16],    // buttoned cuff
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
    [0.16 + extra, 0.27],      // lapel collar base
    [0.30 + extra, 0.20],      // structured tailored shoulder pad
    [0.31 + extra, 0.10],      // chest breadth
    [0.295 + extra, -0.04],    // waist
    [0.30 + extra, -0.22],     // jacket skirt
    [0.31 + extra, -0.42],     // jacket dropped hem
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
    [0.205 + extra, 0.18],     // tailored high waist
    [0.245 + extra, 0.08],     // hip flare
    [0.265 + extra, -0.04],    // gluteal breadth
    [0.23 + extra, -0.14],     // crotch taper
    [0.17 + extra, -0.22],     // leg fork
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
    [0.135 + extra, 0.28],     // hip/crotch seam
    [0.138 + extra, 0.16],     // upper thigh
    [0.128 + extra, 0.02],     // mid thigh
    [0.115 + extra, -0.14],    // above knee
    [0.108 + extra, -0.28],    // over knee
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
    [0.108 + extra, 0.26],     // below knee
    [0.112 + extra, 0.14],     // calf drape
    [0.104 + extra, 0.00],     // mid calf
    [0.095 + extra, -0.14],    // lower calf
    [0.092 + extra, -0.26],    // ankle hem break
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
  const extra = 0.040;
  const profile: [number, number][] = [
    [0.001, 0.28],
    [0.152 + extra, 0.28],     // deep pleat volume
    [0.150 + extra, 0.14],
    [0.145 + extra, -0.02],
    [0.142 + extra, -0.16],
    [0.140 + extra, -0.28],    // relaxed knee
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
    [0.140 + extra, 0.26],
    [0.138 + extra, 0.12],
    [0.136 + extra, -0.02],
    [0.134 + extra, -0.16],
    [0.132 + extra, -0.26],    // wide hem pooling at shoe
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
    [0.136 + extra, 0.00],
    [0.134 + extra, -0.10],    // shorts hem mid-thigh
    [0.001, -0.10],
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
  const geo = new THREE.BoxGeometry(0.114, 0.030, 0.248, 2, 1, 4);
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
  const geo = new THREE.BoxGeometry(0.10, 0.072, 0.235, 2, 2, 4);
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
