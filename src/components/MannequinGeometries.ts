import * as THREE from "three";

/**
 * Creates smooth organic lathe geometry from a 2D silhouette curve.
 * This produces natural curves for calves, thighs, torso, neck, etc.
 */
export function createLatheProfile(
  points: [x: number, y: number][],
  segments = 32
): THREE.BufferGeometry {
  const v2Points = points.map(([x, y]) => new THREE.Vector2(x, y));
  const curve = new THREE.SplineCurve(v2Points);
  const smoothPoints = curve.getPoints(segments);
  const geo = new THREE.LatheGeometry(smoothPoints, 36);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Procedural Anatomical Geometry Builders
 */

// 1. Sculpted Head & Jaw Croquis with anatomical skull curvature
export function createSculptedHeadGeometry(): THREE.BufferGeometry {
  // Anatomical skull: cranial vault -> temple -> zygomatic arch (cheekbones) -> mandible -> chin
  const profile: [number, number][] = [
    [0.001, 0.27],   // crown
    [0.08, 0.265],   // superior parietal
    [0.155, 0.22],   // parietal ridge
    [0.18, 0.14],    // superior temporal line
    [0.185, 0.06],   // zygomatic cheekbone apex
    [0.165, -0.02],  // infraorbital hollow
    [0.14, -0.09],   // maxilla / jaw angle
    [0.10, -0.17],   // gonial angle (mandibular taper)
    [0.055, -0.23],  // mental protuberance (chin flare)
    [0.001, -0.245], // mentalis base
  ];
  const geo = createLatheProfile(profile, 36);
  // Human skull is slightly narrower ear-to-ear and elongated front-to-back
  geo.scale(0.88, 1.0, 1.08);
  return geo;
}

// 2. Sculpted Neck with Sternocleidomastoid & Trapezius taper
export function createNeckGeometry(): THREE.BufferGeometry {
  const profile: [number, number][] = [
    [0.001, 0.13],   // base of skull cap
    [0.065, 0.13],   // submandibular line
    [0.062, 0.06],   // mid cervical spine
    [0.072, -0.02],  // lower thyroid cartilage level
    [0.105, -0.09],  // clavicular hollow transition
    [0.155, -0.14],  // trapezius slope onto shoulder
    [0.001, -0.14],  // clavicle base cap
  ];
  const geo = createLatheProfile(profile, 24);
  geo.scale(0.92, 1.0, 0.86);
  return geo;
}

// 3. Sculpted Upper Torso & Chest / Ribcage with anatomical lumbar curve
export function createTorsoGeometry(isBodysuit = false): THREE.BufferGeometry {
  const extra = isBodysuit ? 0.008 : 0;
  // Natural thoracic spine and pectoral/latissimus contours
  const profile: [number, number][] = [
    [0.001, 0.28 + extra], // top cap
    [0.155 + extra, 0.28 + extra], // suprasternal notch & clavicle
    [0.235 + extra, 0.23], // acromion (shoulder cap)
    [0.27 + extra, 0.14],  // pectoralis major / bust apex
    [0.255 + extra, 0.04], // inframammary fold / xiphoid process
    [0.235 + extra, -0.06],// costal margin (lower ribcage)
    [0.20 + extra, -0.16], // natural waist narrowing
    [0.18 + extra, -0.23], // narrowest waistline
    [0.215 + extra, -0.30 - extra], // anterior superior iliac spine (iliac crest start)
    [0.001, -0.30 - extra], // pelvic junction cap
  ];
  const geo = createLatheProfile(profile, 36);
  // Ribcage has wider lateral breadth than anteroposterior depth
  geo.scale(1.0, 1.0, 0.70);
  return geo;
}

// 4. Sculpted Pelvis & Hips with gluteal contour
export function createPelvisGeometry(isBodysuit = false): THREE.BufferGeometry {
  const extra = isBodysuit ? 0.008 : 0;
  // Iliac crest flare -> greater trochanter -> gluteal fold
  const profile: [number, number][] = [
    [0.001, 0.17 + extra], // top cap
    [0.185 + extra, 0.17 + extra],  // waist junction
    [0.225 + extra, 0.10],  // iliac crest fullness
    [0.255 + extra, 0.00],  // greater trochanter (widest hip/glute)
    [0.228 + extra, -0.10], // subtrochanteric curve
    [0.175 + extra, -0.20 - extra], // pubic arch / ischial line
    [0.001, -0.20 - extra], // perineal base cap
  ];
  const geo = createLatheProfile(profile, 32);
  geo.scale(1.0, 1.0, 0.84);
  return geo;
}

// 5. Sculpted Thigh with Quadricep & Hamstring contour
export function createThighGeometry(): THREE.BufferGeometry {
  const profile: [number, number][] = [
    [0.001, 0.29], // top cap
    [0.118, 0.29], // femoral neck / hip socket
    [0.125, 0.20], // rectus femoris / tensor fasciae latae apex
    [0.116, 0.08], // mid thigh (vastus lateralis)
    [0.098, -0.08],// lower thigh taper
    [0.082, -0.22],// suprapatellar tendon
    [0.076, -0.28],// femoral condyle (knee top)
    [0.001, -0.28],// knee joint cap
  ];
  const geo = createLatheProfile(profile, 28);
  // Human thighs have greater front-to-back depth (quads + hamstrings) than side-to-side
  geo.scale(0.94, 1.0, 1.08);
  return geo;
}

// 6. Sculpted Calf & Shin with gastrocnemius (widest calf muscle)
export function createCalfGeometry(): THREE.BufferGeometry {
  const profile: [number, number][] = [
    [0.001, 0.27], // top cap
    [0.076, 0.27], // tibial plateau (below knee)
    [0.096, 0.17], // gastrocnemius belly (muscular apex)
    [0.090, 0.07], // soleus muscle curve
    [0.068, -0.07],// achilles tendon taper
    [0.052, -0.20],// supramalleolar ankle narrow
    [0.059, -0.25],// medial & lateral malleolus (ankle bones)
    [0.001, -0.25],// ankle bottom cap
  ];
  const geo = createLatheProfile(profile, 28);
  // Gastrocnemius bellies flare prominently backwards
  geo.scale(0.90, 1.0, 1.12);
  return geo;
}

// 7. Sculpted Upper Arm (Bicep/Tricep & Deltoid curvature)
export function createUpperArmGeometry(): THREE.BufferGeometry {
  const profile: [number, number][] = [
    [0.001, 0.21], // top cap
    [0.088, 0.21], // deltoid insertion
    [0.084, 0.11], // bicep apex / tricep curve
    [0.074, -0.01],// brachialis transition
    [0.062, -0.13],// distal humerus taper
    [0.056, -0.20],// medial & lateral epicondyles (elbow)
    [0.001, -0.20],// elbow joint cap
  ];
  const geo = createLatheProfile(profile, 24);
  geo.scale(0.94, 1.0, 1.06);
  return geo;
}

// 8. Sculpted Forearm with Brachioradialis taper
export function createForearmGeometry(): THREE.BufferGeometry {
  const profile: [number, number][] = [
    [0.001, 0.19], // top cap
    [0.058, 0.19], // below elbow
    [0.072, 0.11], // brachioradialis muscular fullness
    [0.060, 0.01], // mid forearm (flexors/extensors)
    [0.046, -0.11],// pronator quadratus taper
    [0.040, -0.18],// styloid process of radius (wrist)
    [0.001, -0.18],// wrist cap
  ];
  const geo = createLatheProfile(profile, 24);
  geo.scale(0.90, 1.0, 1.04);
  return geo;
}

// 9. Sculpted Minimalist Atelier Foot with natural arch & instep
export function createFootGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.09, 0.075, 0.22, 3, 3, 5);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Instep arch (lift underside in midfoot)
    if (z > -0.06 && z < 0.08 && y < 0) {
      pos.setY(i, y + 0.012 * Math.cos((z / 0.08) * (Math.PI / 2)));
    }
    // Anteroposterior taper towards toe
    if (z > 0) {
      pos.setX(i, x * (1 - z * 1.3));
      pos.setY(i, y * (1 - z * 1.1));
    }
  }
  geo.computeVertexNormals();
  return geo;
}

// 10. Sculpted Minimalist Atelier Hand with natural relaxed pose taper
export function createHandGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.048, 0.15, 0.078, 2, 4, 3);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    // Taper towards fingertips (y < 0) with gentle natural curvature
    if (y < 0) {
      pos.setX(i, pos.getX(i) * 0.68);
      pos.setZ(i, pos.getZ(i) * 0.82);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

// 11. Minimalist Joint Articulation Sphere
export function createJointGeometry(radius: number): THREE.BufferGeometry {
  return new THREE.SphereGeometry(radius, 28, 28);
}
