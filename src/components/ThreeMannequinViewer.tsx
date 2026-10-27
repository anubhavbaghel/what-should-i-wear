import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCw, RefreshCw, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { cn } from "@/lib/utils";
import {
  createSculptedHeadGeometry,
  createNeckGeometry,
  createTorsoGeometry,
  createPelvisGeometry,
  createThighGeometry,
  createCalfGeometry,
  createUpperArmGeometry,
  createForearmGeometry,
  createFootGeometry,
  createHandGeometry,
  createJointGeometry,
} from "./MannequinGeometries";
import {
  createTeeTorsoGeometry,
  createShortSleeveGeometry,
  createShirtTorsoGeometry,
  createLongSleeveUpperGeometry,
  createLongSleeveForearmGeometry,
  createJacketTorsoGeometry,
  createPantsPelvisGeometry,
  createStraightPantsThighGeometry,
  createStraightPantsCalfGeometry,
  createWidePantsThighGeometry,
  createWidePantsCalfGeometry,
  createShortsThighGeometry,
  createSneakerGeometry,
  createSneakerSoleGeometry,
  createLoaferGeometry,
} from "./GarmentGeometries";

export type BuildType = "slim" | "neutral" | "curvy";
export type StylePresentationType = "neutral" | "masculine" | "feminine";

export type TopGarmentType = "none" | "tee" | "shirt" | "jacket";
export type BottomGarmentType = "none" | "trousers" | "wide_chinos" | "shorts";
export type ShoesGarmentType = "none" | "sneakers" | "loafers";

export interface MannequinOutfitConfig {
  topType?: TopGarmentType;
  topColor?: string;
  bottomType?: BottomGarmentType;
  bottomColor?: string;
  shoesType?: ShoesGarmentType;
  shoesColor?: string;
}

export interface BodyMorphConfig {
  shoulderWidth?: number; // 0.85 to 1.25, default 1.0
  chestBust?: number;     // 0.85 to 1.30, default 1.0
  waistScale?: number;    // 0.80 to 1.25, default 1.0
  hipWidth?: number;      // 0.85 to 1.35, default 1.0
  legFullness?: number;   // 0.85 to 1.25, default 1.0
}

export type ModelPresetType = "xbot" | "michelle" | "soldier" | "base" | "procedural" | string;

export interface ThreeMannequinViewerProps {
  modelType?: ModelPresetType;
  build?: BuildType;
  skinToneHex?: string;
  presentation?: StylePresentationType;
  baseWearHex?: string;
  heightScale?: number; // 0.9 to 1.1
  bodyMorphs?: BodyMorphConfig;
  className?: string;
  autoRotateDefault?: boolean;
  outfit?: MannequinOutfitConfig;
}

export function ThreeMannequinViewer({
  modelType = "xbot",
  build = "neutral",
  skinToneHex = "#D59D7B",
  presentation = "neutral",
  baseWearHex = "#232326",
  heightScale = 1.0,
  bodyMorphs,
  className,
  autoRotateDefault = false,
  outfit,
}: ThreeMannequinViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(autoRotateDefault);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mannequinGroupRef = useRef<THREE.Group | null>(null);
  const externalModelGroupRef = useRef<THREE.Group | null>(null);
  const loadedModelRef = useRef<THREE.Object3D | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Material refs for dynamic updates
  const skinMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const baseWearMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Part refs for morphing proportions
  const torsoRef = useRef<THREE.Mesh | null>(null);
  const chestBaseRef = useRef<THREE.Mesh | null>(null);
  const hipsRef = useRef<THREE.Mesh | null>(null);
  const hipsBaseRef = useRef<THREE.Mesh | null>(null);
  const leftLegRef = useRef<THREE.Group | null>(null);
  const rightLegRef = useRef<THREE.Group | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);

  // Garment Material refs
  const topMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const bottomMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const shoesMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const shoesSoleMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Garment Mesh refs
  const teeTorsoRef = useRef<THREE.Mesh | null>(null);
  const shirtTorsoRef = useRef<THREE.Mesh | null>(null);
  const jacketTorsoRef = useRef<THREE.Mesh | null>(null);
  const leftShortSleeveRef = useRef<THREE.Mesh | null>(null);
  const rightShortSleeveRef = useRef<THREE.Mesh | null>(null);
  const leftLongUpperRef = useRef<THREE.Mesh | null>(null);
  const rightLongUpperRef = useRef<THREE.Mesh | null>(null);
  const leftLongForeRef = useRef<THREE.Mesh | null>(null);
  const rightLongForeRef = useRef<THREE.Mesh | null>(null);

  const pantsPelvisRef = useRef<THREE.Mesh | null>(null);
  const leftStraightThighRef = useRef<THREE.Mesh | null>(null);
  const rightStraightThighRef = useRef<THREE.Mesh | null>(null);
  const leftStraightCalfRef = useRef<THREE.Mesh | null>(null);
  const rightStraightCalfRef = useRef<THREE.Mesh | null>(null);
  const leftWideThighRef = useRef<THREE.Mesh | null>(null);
  const rightWideThighRef = useRef<THREE.Mesh | null>(null);
  const leftWideCalfRef = useRef<THREE.Mesh | null>(null);
  const rightWideCalfRef = useRef<THREE.Mesh | null>(null);
  const leftShortsThighRef = useRef<THREE.Mesh | null>(null);
  const rightShortsThighRef = useRef<THREE.Mesh | null>(null);

  const leftFootBareRef = useRef<THREE.Mesh | null>(null);
  const rightFootBareRef = useRef<THREE.Mesh | null>(null);
  const leftSneakerRef = useRef<THREE.Group | null>(null);
  const rightSneakerRef = useRef<THREE.Group | null>(null);
  const leftLoaferRef = useRef<THREE.Mesh | null>(null);
  const rightLoaferRef = useRef<THREE.Mesh | null>(null);

  // Orbit & Zoom state
  const rotationRef = useRef({ y: 0, targetY: 0, pitch: 0.1, targetPitch: 0.1 });
  const zoomRef = useRef({ distance: 4.0, targetDistance: 4.0, min: 2.2, max: 6.2 });
  const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0 is default
  const isPointerDownRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 420;

    // 2. Camera setup - centered on body midpoint (Y = 0.0, mannequin spans from -1.1 to +1.25)
    const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 50);
    camera.position.set(0, 0.05, 4.0);
    camera.lookAt(0, 0.05, 0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xfff8f2, 0.7);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2.5, 4.5, 3.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 10;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xe8f0ff, 0.6);
    fillLight.position.set(-3, 2, 2.5);
    scene.add(fillLight);

    // Rim Light (back-light for silhouette definition)
    const rimLight = new THREE.DirectionalLight(0xffecd6, 1.2);
    rimLight.position.set(0, 3.5, -3.5);
    scene.add(rimLight);

    // 5. Studio Pedestal / Turntable Platform
    const pedestalGroup = new THREE.Group();
    const pedestalGeo = new THREE.CylinderGeometry(1.2, 1.28, 0.08, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xefede8,
      roughness: 0.35,
      metalness: 0.1,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = -1.14;
    pedestalMesh.receiveShadow = true;
    pedestalGroup.add(pedestalMesh);

    // Platform chrome trim rim
    const rimGeo = new THREE.TorusGeometry(1.24, 0.015, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1b1b1d,
      roughness: 0.2,
      metalness: 0.6,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = -1.1;
    pedestalGroup.add(rimMesh);

    scene.add(pedestalGroup);

    // 6. Materials - High-End PBR Skin Shader with Subsurface Scattering emulation
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(skinToneHex),
      roughness: 0.52,
      metalness: 0.02,
      clearcoat: 0.12,
      clearcoatRoughness: 0.38,
      sheen: 0.35,
      sheenColor: new THREE.Color(0xffe2d2),
      sheenRoughness: 0.45,
    });
    skinMaterialRef.current = skinMat;

    const baseWearMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseWearHex),
      roughness: 0.85,
      metalness: 0.02,
    });
    baseWearMaterialRef.current = baseWearMat;

    // Garment Materials
    const topMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(outfit?.topColor || "#F2EFE9"),
      roughness: 0.82,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    topMaterialRef.current = topMat;

    const bottomMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(outfit?.bottomColor || "#383E38"),
      roughness: 0.78,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    bottomMaterialRef.current = bottomMat;

    const shoesMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(outfit?.shoesColor || "#F8F8F8"),
      roughness: 0.45,
      metalness: 0.05,
    });
    shoesMaterialRef.current = shoesMat;

    const shoesSoleMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#EBE8E3"),
      roughness: 0.55,
      metalness: 0.02,
    });
    shoesSoleMaterialRef.current = shoesSoleMat;

    // 7. Build Procedural Anatomical Mannequin
    const mannequinGroup = new THREE.Group();
    mannequinGroupRef.current = mannequinGroup;
    scene.add(mannequinGroup);

    // Head (Sculpted Croquis)
    const headGeo = createSculptedHeadGeometry();
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.y = 1.0;
    headMesh.castShadow = true;
    mannequinGroup.add(headMesh);

    // Neck & Clavicle
    const neckGeo = createNeckGeometry();
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.77;
    neckMesh.castShadow = true;
    mannequinGroup.add(neckMesh);

    // Upper Torso / Chest & Ribcage
    const torsoGeo = createTorsoGeometry(false);
    const torsoMesh = new THREE.Mesh(torsoGeo, skinMat);
    torsoMesh.position.y = 0.50;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torsoRef.current = torsoMesh;
    mannequinGroup.add(torsoMesh);

    // Base Wear: Bodysuit Top
    const chestBaseGeo = createTorsoGeometry(true);
    const chestBaseMesh = new THREE.Mesh(chestBaseGeo, baseWearMat);
    chestBaseMesh.position.y = 0.50;
    chestBaseMesh.castShadow = true;
    chestBaseRef.current = chestBaseMesh;
    mannequinGroup.add(chestBaseMesh);

    // Top Garments: T-Shirt Torso
    const teeTorsoMesh = new THREE.Mesh(createTeeTorsoGeometry(), topMat);
    teeTorsoMesh.position.y = 0.50;
    teeTorsoMesh.castShadow = true;
    teeTorsoMesh.visible = outfit?.topType === "tee";
    teeTorsoRef.current = teeTorsoMesh;
    mannequinGroup.add(teeTorsoMesh);

    // Top Garments: Button-Down Shirt Torso
    const shirtTorsoMesh = new THREE.Mesh(createShirtTorsoGeometry(), topMat);
    shirtTorsoMesh.position.y = 0.50;
    shirtTorsoMesh.castShadow = true;
    shirtTorsoMesh.visible = outfit?.topType === "shirt";
    shirtTorsoRef.current = shirtTorsoMesh;
    mannequinGroup.add(shirtTorsoMesh);

    // Top Garments: Structured Jacket / Coat Torso
    const jacketTorsoMesh = new THREE.Mesh(createJacketTorsoGeometry(), topMat);
    jacketTorsoMesh.position.y = 0.50;
    jacketTorsoMesh.castShadow = true;
    jacketTorsoMesh.visible = outfit?.topType === "jacket";
    jacketTorsoRef.current = jacketTorsoMesh;
    mannequinGroup.add(jacketTorsoMesh);

    // Pelvis & Hips
    const hipsGeo = createPelvisGeometry(false);
    const hipsMesh = new THREE.Mesh(hipsGeo, skinMat);
    hipsMesh.position.y = 0.08;
    hipsMesh.castShadow = true;
    hipsRef.current = hipsMesh;
    mannequinGroup.add(hipsMesh);

    // Base Wear: Bodysuit Shorts
    const hipsBaseGeo = createPelvisGeometry(true);
    const hipsBaseMesh = new THREE.Mesh(hipsBaseGeo, baseWearMat);
    hipsBaseMesh.position.y = 0.08;
    hipsBaseMesh.castShadow = true;
    hipsBaseRef.current = hipsBaseMesh;
    mannequinGroup.add(hipsBaseMesh);

    // Bottom Garments: Pants Pelvis Shell
    const pantsPelvisMesh = new THREE.Mesh(createPantsPelvisGeometry(), bottomMat);
    pantsPelvisMesh.position.y = 0.08;
    pantsPelvisMesh.castShadow = true;
    pantsPelvisMesh.visible = outfit?.bottomType !== undefined && outfit.bottomType !== "none";
    pantsPelvisRef.current = pantsPelvisMesh;
    mannequinGroup.add(pantsPelvisMesh);

    // Arms (Left & Right)
    function createArm(isLeft: boolean) {
      const armGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Shoulder ball articulation
      const shoulderGeo = createJointGeometry(0.075);
      const shoulder = new THREE.Mesh(shoulderGeo, skinMat);
      shoulder.castShadow = true;
      armGroup.add(shoulder);

      // Sculpted Upper arm (Bicep/Deltoid)
      const upperGeo = createUpperArmGeometry();
      const upper = new THREE.Mesh(upperGeo, skinMat);
      upper.position.set(sign * 0.04, -0.19, 0);
      upper.rotation.z = sign * -0.12;
      upper.castShadow = true;
      armGroup.add(upper);

      // Short sleeve (Tee)
      const shortSleeveMesh = new THREE.Mesh(createShortSleeveGeometry(), topMat);
      shortSleeveMesh.position.set(sign * 0.04, -0.19, 0);
      shortSleeveMesh.rotation.z = sign * -0.12;
      shortSleeveMesh.castShadow = true;
      shortSleeveMesh.visible = outfit?.topType === "tee";
      if (isLeft) leftShortSleeveRef.current = shortSleeveMesh;
      else rightShortSleeveRef.current = shortSleeveMesh;
      armGroup.add(shortSleeveMesh);

      // Long sleeve upper (Shirt / Jacket)
      const longUpperMesh = new THREE.Mesh(createLongSleeveUpperGeometry(), topMat);
      longUpperMesh.position.set(sign * 0.04, -0.19, 0);
      longUpperMesh.rotation.z = sign * -0.12;
      longUpperMesh.castShadow = true;
      longUpperMesh.visible = outfit?.topType === "shirt" || outfit?.topType === "jacket";
      if (isLeft) leftLongUpperRef.current = longUpperMesh;
      else rightLongUpperRef.current = longUpperMesh;
      armGroup.add(longUpperMesh);

      // Elbow joint articulation
      const elbowGeo = createJointGeometry(0.055);
      const elbow = new THREE.Mesh(elbowGeo, skinMat);
      elbow.position.set(sign * 0.075, -0.40, 0);
      elbow.castShadow = true;
      armGroup.add(elbow);

      // Sculpted Forearm
      const foreGeo = createForearmGeometry();
      const fore = new THREE.Mesh(foreGeo, skinMat);
      fore.position.set(sign * 0.09, -0.59, 0.02);
      fore.rotation.z = sign * -0.05;
      fore.castShadow = true;
      armGroup.add(fore);

      // Long sleeve forearm (Shirt / Jacket)
      const longForeMesh = new THREE.Mesh(createLongSleeveForearmGeometry(), topMat);
      longForeMesh.position.set(sign * 0.09, -0.59, 0.02);
      longForeMesh.rotation.z = sign * -0.05;
      longForeMesh.castShadow = true;
      longForeMesh.visible = outfit?.topType === "shirt" || outfit?.topType === "jacket";
      if (isLeft) leftLongForeRef.current = longForeMesh;
      else rightLongForeRef.current = longForeMesh;
      armGroup.add(longForeMesh);

      // Minimalist Atelier Hand
      const handGeo = createHandGeometry();
      const hand = new THREE.Mesh(handGeo, skinMat);
      hand.position.set(sign * 0.10, -0.80, 0.02);
      hand.castShadow = true;
      armGroup.add(hand);

      return armGroup;
    }

    const leftArm = createArm(true);
    leftArm.position.set(-0.28, 0.65, 0);
    leftArmRef.current = leftArm;
    mannequinGroup.add(leftArm);

    const rightArm = createArm(false);
    rightArm.position.set(0.28, 0.65, 0);
    rightArmRef.current = rightArm;
    mannequinGroup.add(rightArm);

    // Legs (Left & Right)
    function createLeg(isLeft: boolean) {
      const legGroup = new THREE.Group();
      const sign = isLeft ? -1 : 1;

      // Hip joint ball articulation
      const hipJointGeo = createJointGeometry(0.08);
      const hipJoint = new THREE.Mesh(hipJointGeo, skinMat);
      hipJoint.castShadow = true;
      legGroup.add(hipJoint);

      // Sculpted Thigh
      const thighGeo = createThighGeometry();
      const thigh = new THREE.Mesh(thighGeo, skinMat);
      thigh.position.set(sign * 0.015, -0.26, 0);
      thigh.castShadow = true;
      legGroup.add(thigh);

      // Straight Pants Thigh
      const straightThigh = new THREE.Mesh(createStraightPantsThighGeometry(), bottomMat);
      straightThigh.position.set(sign * 0.015, -0.26, 0);
      straightThigh.castShadow = true;
      straightThigh.visible = outfit?.bottomType === "trousers";
      if (isLeft) leftStraightThighRef.current = straightThigh;
      else rightStraightThighRef.current = straightThigh;
      legGroup.add(straightThigh);

      // Wide Chinos Thigh
      const wideThigh = new THREE.Mesh(createWidePantsThighGeometry(), bottomMat);
      wideThigh.position.set(sign * 0.015, -0.26, 0);
      wideThigh.castShadow = true;
      wideThigh.visible = outfit?.bottomType === "wide_chinos";
      if (isLeft) leftWideThighRef.current = wideThigh;
      else rightWideThighRef.current = wideThigh;
      legGroup.add(wideThigh);

      // Shorts Thigh
      const shortsThigh = new THREE.Mesh(createShortsThighGeometry(), bottomMat);
      shortsThigh.position.set(sign * 0.015, -0.26, 0);
      shortsThigh.castShadow = true;
      shortsThigh.visible = outfit?.bottomType === "shorts";
      if (isLeft) leftShortsThighRef.current = shortsThigh;
      else rightShortsThighRef.current = shortsThigh;
      legGroup.add(shortsThigh);

      // Knee joint articulation
      const kneeGeo = createJointGeometry(0.065);
      const knee = new THREE.Mesh(kneeGeo, skinMat);
      knee.position.set(sign * 0.02, -0.54, 0);
      knee.castShadow = true;
      legGroup.add(knee);

      // Sculpted Calf & Shin
      const calfGeo = createCalfGeometry();
      const calf = new THREE.Mesh(calfGeo, skinMat);
      calf.position.set(sign * 0.02, -0.80, 0);
      calf.castShadow = true;
      legGroup.add(calf);

      // Straight Pants Calf
      const straightCalf = new THREE.Mesh(createStraightPantsCalfGeometry(), bottomMat);
      straightCalf.position.set(sign * 0.02, -0.80, 0);
      straightCalf.castShadow = true;
      straightCalf.visible = outfit?.bottomType === "trousers";
      if (isLeft) leftStraightCalfRef.current = straightCalf;
      else rightStraightCalfRef.current = straightCalf;
      legGroup.add(straightCalf);

      // Wide Chinos Calf
      const wideCalf = new THREE.Mesh(createWidePantsCalfGeometry(), bottomMat);
      wideCalf.position.set(sign * 0.02, -0.80, 0);
      wideCalf.castShadow = true;
      wideCalf.visible = outfit?.bottomType === "wide_chinos";
      if (isLeft) leftWideCalfRef.current = wideCalf;
      else rightWideCalfRef.current = wideCalf;
      legGroup.add(wideCalf);

      // Sculpted Atelier Foot (bare)
      const footGeo = createFootGeometry();
      const foot = new THREE.Mesh(footGeo, skinMat);
      foot.position.set(sign * 0.02, -1.05, 0.04);
      foot.castShadow = true;
      foot.visible = !outfit?.shoesType || outfit.shoesType === "none";
      if (isLeft) leftFootBareRef.current = foot;
      else rightFootBareRef.current = foot;
      legGroup.add(foot);

      // Sneaker Group
      const sneakerGroup = new THREE.Group();
      sneakerGroup.position.set(sign * 0.02, -1.05, 0.04);
      sneakerGroup.visible = outfit?.shoesType === "sneakers";
      const sneakerUpper = new THREE.Mesh(createSneakerGeometry(), shoesMat);
      sneakerUpper.castShadow = true;
      sneakerGroup.add(sneakerUpper);
      const sneakerSole = new THREE.Mesh(createSneakerSoleGeometry(), shoesSoleMat);
      sneakerSole.position.y = -0.038;
      sneakerSole.castShadow = true;
      sneakerGroup.add(sneakerSole);
      if (isLeft) leftSneakerRef.current = sneakerGroup;
      else rightSneakerRef.current = sneakerGroup;
      legGroup.add(sneakerGroup);

      // Loafer
      const loaferMesh = new THREE.Mesh(createLoaferGeometry(), shoesMat);
      loaferMesh.position.set(sign * 0.02, -1.05, 0.04);
      loaferMesh.castShadow = true;
      loaferMesh.visible = outfit?.shoesType === "loafers";
      if (isLeft) leftLoaferRef.current = loaferMesh;
      else rightLoaferRef.current = loaferMesh;
      legGroup.add(loaferMesh);

      return legGroup;
    }

    const leftLeg = createLeg(true);
    leftLeg.position.set(-0.13, -0.05, 0);
    leftLegRef.current = leftLeg;
    mannequinGroup.add(leftLeg);

    const rightLeg = createLeg(false);
    rightLeg.position.set(0.13, -0.05, 0);
    rightLegRef.current = rightLeg;
    mannequinGroup.add(rightLeg);

    // Initial scale & position
    mannequinGroup.position.y = 0.02;

    // 7b. External 3D Model Group (Mixamo X-Bot, GLB Models)
    const externalModelGroup = new THREE.Group();
    externalModelGroupRef.current = externalModelGroup;
    scene.add(externalModelGroup);

    // 8. Animation & Render Loop
    let lastTime = performance.now();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      const rot = rotationRef.current;

      // Auto-rotation when enabled and user not dragging
      if (autoRotate && !isPointerDownRef.current) {
        rot.targetY += delta * 0.6;
      }

      // Smooth lerp damping towards target
      rot.y += (rot.targetY - rot.y) * 0.12;
      rot.pitch += (rot.targetPitch - rot.pitch) * 0.12;

      // Smooth zoom damping
      const z = zoomRef.current;
      z.distance += (z.targetDistance - z.distance) * 0.14;
      if (camera) {
        camera.position.z = z.distance;
      }

      if (mannequinGroupRef.current) {
        mannequinGroupRef.current.rotation.y = rot.y;
        mannequinGroupRef.current.rotation.x = rot.pitch;
      }

      if (externalModelGroupRef.current) {
        externalModelGroupRef.current.rotation.y = rot.y;
        externalModelGroupRef.current.rotation.x = rot.pitch;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // 10. Pointer / Touch Events for 360° Drag & Pinch Zoom
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isPointerDownRef.current = true;
      setIsInteracting(true);

      if ("touches" in e) {
        if (e.touches.length === 2) {
          // Pinch start
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          pinchStartDistRef.current = Math.hypot(dx, dy);
          return;
        }
        pointerStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isPointerDownRef.current) return;

      if ("touches" in e && e.touches.length === 2) {
        // Pinch Zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);

        if (pinchStartDistRef.current !== null) {
          const factor = pinchStartDistRef.current / currentDist;
          zoomRef.current.targetDistance = Math.max(
            zoomRef.current.min,
            Math.min(zoomRef.current.max, zoomRef.current.targetDistance * (factor > 1 ? 1.02 : 0.98))
          );
        }
        pinchStartDistRef.current = currentDist;
        return;
      }

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - pointerStartRef.current.x;
      const deltaY = clientY - pointerStartRef.current.y;

      pointerStartRef.current = { x: clientX, y: clientY };

      // Update rotational target
      rotationRef.current.targetY += deltaX * 0.012;
      rotationRef.current.targetPitch = Math.max(
        -0.25,
        Math.min(0.35, rotationRef.current.targetPitch + deltaY * 0.008)
      );
    };

    const onPointerUp = () => {
      isPointerDownRef.current = false;
      setIsInteracting(false);
      pinchStartDistRef.current = null;
    };

    // Wheel Zoom handler
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.003;
      zoomRef.current.targetDistance = Math.max(
        zoomRef.current.min,
        Math.min(zoomRef.current.max, zoomRef.current.targetDistance + zoomDelta)
      );
    };

    const el = renderer.domElement;
    el.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    el.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("touchend", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    // Cleanup on unmount
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);

      el.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);

      el.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
      el.removeEventListener("wheel", onWheel);

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Load external 3D model (Mixamo X-Bot, GLB models) or toggle procedural
  useEffect(() => {
    const extGroup = externalModelGroupRef.current;
    const manGroup = mannequinGroupRef.current;
    const skinMat = skinMaterialRef.current;

    if (!extGroup || !manGroup) return;

    if (modelType === "procedural") {
      extGroup.visible = false;
      manGroup.visible = true;
      loadedModelRef.current = null;
      setIsLoadingModel(false);
      return;
    }

    setIsLoadingModel(true);

    const targetHeight = 2.24;
    const targetGroundY = -1.14;

    function applyTransformsAndMaterials(obj: THREE.Object3D) {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      box.getSize(size);
      if (size.y > 0) {
        const scale = targetHeight / size.y;
        obj.scale.setScalar(scale);
        box.setFromObject(obj);
        obj.position.y = targetGroundY - box.min.y;
        obj.position.x = 0;
        obj.position.z = 0;
      }
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.name === "Beta_Surface" && skinMat) {
            mesh.material = skinMat;
          } else if (mesh.name === "Beta_Joints") {
            mesh.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(0x232428),
              metalness: 0.85,
              roughness: 0.25,
            });
          }
        }
      });
    }

    let isCancelled = false;

    if (modelType === "xbot") {
      const fbxLoader = new FBXLoader();
      fbxLoader.load(
        "/models/x-bot.fbx",
        (fbx) => {
          if (isCancelled) return;
          applyTransformsAndMaterials(fbx);
          extGroup.clear();
          extGroup.add(fbx);
          extGroup.visible = true;
          manGroup.visible = false;
          loadedModelRef.current = fbx;
          setIsLoadingModel(false);
        },
        undefined,
        (err) => {
          console.warn("FBX load failed, falling back to avatar-base.glb:", err);
          if (isCancelled) return;
          const gltfLoader = new GLTFLoader();
          gltfLoader.load(
            "/models/avatar-base.glb",
            (gltf) => {
              if (isCancelled) return;
              applyTransformsAndMaterials(gltf.scene);
              extGroup.clear();
              extGroup.add(gltf.scene);
              extGroup.visible = true;
              manGroup.visible = false;
              loadedModelRef.current = gltf.scene;
              setIsLoadingModel(false);
            },
            undefined,
            () => {
              if (isCancelled) return;
              manGroup.visible = true;
              setIsLoadingModel(false);
            }
          );
        }
      );
    } else {
      const gltfUrl =
        modelType === "michelle"
          ? "/models/michelle.glb"
          : modelType === "soldier"
          ? "/models/soldier.glb"
          : modelType === "base"
          ? "/models/avatar-base.glb"
          : modelType;

      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        gltfUrl,
        (gltf) => {
          if (isCancelled) return;
          applyTransformsAndMaterials(gltf.scene);
          extGroup.clear();
          extGroup.add(gltf.scene);
          extGroup.visible = true;
          manGroup.visible = false;
          loadedModelRef.current = gltf.scene;
          setIsLoadingModel(false);
        },
        undefined,
        (err) => {
          console.warn(`GLTF load failed for ${gltfUrl}:`, err);
          if (isCancelled) return;
          manGroup.visible = true;
          setIsLoadingModel(false);
        }
      );
    }

    return () => {
      isCancelled = true;
    };
  }, [modelType]);

  // Morph proportions and update garments whenever build, presentation, height, or outfit changes
  useEffect(() => {
    if (!skinMaterialRef.current || !baseWearMaterialRef.current) return;

    // Update material colors
    skinMaterialRef.current.color.set(skinToneHex);
    baseWearMaterialRef.current.color.set(baseWearHex);

    // Update external model skin tone if active
    if (loadedModelRef.current) {
      loadedModelRef.current.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && child.name === "Beta_Surface") {
          const mesh = child as THREE.Mesh;
          if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).color) {
            (mesh.material as THREE.MeshStandardMaterial).color.set(skinToneHex);
          }
        }
      });
    }

    if (topMaterialRef.current && outfit?.topColor) {
      topMaterialRef.current.color.set(outfit.topColor);
    }
    if (bottomMaterialRef.current && outfit?.bottomColor) {
      bottomMaterialRef.current.color.set(outfit.bottomColor);
    }
    if (shoesMaterialRef.current && outfit?.shoesColor) {
      shoesMaterialRef.current.color.set(outfit.shoesColor);
    }

    // Top Garments Visibility
    const topType = outfit?.topType || "none";
    if (teeTorsoRef.current) teeTorsoRef.current.visible = topType === "tee";
    if (shirtTorsoRef.current) shirtTorsoRef.current.visible = topType === "shirt";
    if (jacketTorsoRef.current) jacketTorsoRef.current.visible = topType === "jacket";

    const hasShortSleeves = topType === "tee";
    if (leftShortSleeveRef.current) leftShortSleeveRef.current.visible = hasShortSleeves;
    if (rightShortSleeveRef.current) rightShortSleeveRef.current.visible = hasShortSleeves;

    const hasLongSleeves = topType === "shirt" || topType === "jacket";
    if (leftLongUpperRef.current) leftLongUpperRef.current.visible = hasLongSleeves;
    if (rightLongUpperRef.current) rightLongUpperRef.current.visible = hasLongSleeves;
    if (leftLongForeRef.current) leftLongForeRef.current.visible = hasLongSleeves;
    if (rightLongForeRef.current) rightLongForeRef.current.visible = hasLongSleeves;

    if (chestBaseRef.current) {
      chestBaseRef.current.visible = topType === "none" || topType === "jacket";
    }

    // Bottom Garments Visibility
    const bottomType = outfit?.bottomType || "none";
    const hasPants = bottomType !== "none";
    if (pantsPelvisRef.current) pantsPelvisRef.current.visible = hasPants;
    if (hipsBaseRef.current) hipsBaseRef.current.visible = !hasPants;

    const isStraight = bottomType === "trousers";
    if (leftStraightThighRef.current) leftStraightThighRef.current.visible = isStraight;
    if (rightStraightThighRef.current) rightStraightThighRef.current.visible = isStraight;
    if (leftStraightCalfRef.current) leftStraightCalfRef.current.visible = isStraight;
    if (rightStraightCalfRef.current) rightStraightCalfRef.current.visible = isStraight;

    const isWide = bottomType === "wide_chinos";
    if (leftWideThighRef.current) leftWideThighRef.current.visible = isWide;
    if (rightWideThighRef.current) rightWideThighRef.current.visible = isWide;
    if (leftWideCalfRef.current) leftWideCalfRef.current.visible = isWide;
    if (rightWideCalfRef.current) rightWideCalfRef.current.visible = isWide;

    const isShorts = bottomType === "shorts";
    if (leftShortsThighRef.current) leftShortsThighRef.current.visible = isShorts;
    if (rightShortsThighRef.current) rightShortsThighRef.current.visible = isShorts;

    // Footwear Visibility
    const shoesType = outfit?.shoesType || "none";
    const isBare = shoesType === "none";
    if (leftFootBareRef.current) leftFootBareRef.current.visible = isBare;
    if (rightFootBareRef.current) rightFootBareRef.current.visible = isBare;
    if (leftSneakerRef.current) leftSneakerRef.current.visible = shoesType === "sneakers";
    if (rightSneakerRef.current) rightSneakerRef.current.visible = shoesType === "sneakers";
    if (leftLoaferRef.current) leftLoaferRef.current.visible = shoesType === "loafers";
    if (rightLoaferRef.current) rightLoaferRef.current.visible = shoesType === "loafers";

    // Compute proportional scales based on build & presentation + fine-tuned bodyMorphs
    let shoulderScaleX = 1.0;
    let chestScaleX = 1.0;
    let waistScaleX = 1.0;
    let hipScaleX = 1.0;
    let legScaleX = 1.0;

    if (build === "slim") {
      shoulderScaleX = presentation === "masculine" ? 0.95 : 0.88;
      chestScaleX = 0.88;
      waistScaleX = 0.85;
      hipScaleX = presentation === "feminine" ? 0.95 : 0.86;
      legScaleX = 0.88;
    } else if (build === "neutral") {
      shoulderScaleX = presentation === "masculine" ? 1.1 : 1.0;
      chestScaleX = 1.0;
      waistScaleX = 1.0;
      hipScaleX = presentation === "feminine" ? 1.08 : 1.0;
      legScaleX = 1.0;
    } else if (build === "curvy") {
      shoulderScaleX = presentation === "masculine" ? 1.25 : 1.08;
      chestScaleX = 1.2;
      waistScaleX = 1.15;
      hipScaleX = presentation === "feminine" ? 1.28 : 1.18;
      legScaleX = 1.2;
    }

    // Multiply fine-tuned morph targets if provided
    if (bodyMorphs) {
      if (bodyMorphs.shoulderWidth !== undefined) shoulderScaleX *= bodyMorphs.shoulderWidth;
      if (bodyMorphs.chestBust !== undefined) chestScaleX *= bodyMorphs.chestBust;
      if (bodyMorphs.waistScale !== undefined) waistScaleX *= bodyMorphs.waistScale;
      if (bodyMorphs.hipWidth !== undefined) hipScaleX *= bodyMorphs.hipWidth;
      if (bodyMorphs.legFullness !== undefined) legScaleX *= bodyMorphs.legFullness;
    }

    if (torsoRef.current && chestBaseRef.current) {
      torsoRef.current.scale.set(chestScaleX, 1.0, chestScaleX * 0.95);
      chestBaseRef.current.scale.set(chestScaleX * 1.02, 1.0, chestScaleX * 0.97);
      [teeTorsoRef.current, shirtTorsoRef.current, jacketTorsoRef.current].forEach((m) => {
        if (m) m.scale.set(chestScaleX, 1.0, chestScaleX * 0.95);
      });
    }

    if (hipsRef.current && hipsBaseRef.current) {
      hipsRef.current.scale.set(hipScaleX, 1.0, hipScaleX * 0.95);
      hipsBaseRef.current.scale.set(hipScaleX * 1.02, 1.0, hipScaleX * 0.97);
      if (pantsPelvisRef.current) {
        pantsPelvisRef.current.scale.set(hipScaleX, 1.0, hipScaleX * 0.95);
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.position.x = -0.28 * shoulderScaleX;
      rightArmRef.current.position.x = 0.28 * shoulderScaleX;
    }

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.scale.set(legScaleX, 1.0, legScaleX);
      rightLegRef.current.scale.set(legScaleX, 1.0, legScaleX);
      leftLegRef.current.position.x = -0.13 * (hipScaleX * 0.95);
      rightLegRef.current.position.x = 0.13 * (hipScaleX * 0.95);
    }

    if (mannequinGroupRef.current) {
      mannequinGroupRef.current.scale.set(1.0, heightScale, 1.0);
    }
  }, [build, skinToneHex, presentation, baseWearHex, heightScale, outfit, bodyMorphs]);

  function resetView() {
    rotationRef.current.targetY = 0;
    rotationRef.current.targetPitch = 0.05;
    zoomRef.current.targetDistance = 4.0;
  }

  function handleZoomIn() {
    zoomRef.current.targetDistance = Math.max(
      zoomRef.current.min,
      zoomRef.current.targetDistance - 0.5
    );
  }

  function handleZoomOut() {
    zoomRef.current.targetDistance = Math.min(
      zoomRef.current.max,
      zoomRef.current.targetDistance + 0.5
    );
  }

  function snapSide(direction: "front" | "back" | "left" | "right") {
    const map = {
      front: 0,
      right: Math.PI / 2,
      back: Math.PI,
      left: -Math.PI / 2,
    };
    rotationRef.current.targetY = map[direction];
    rotationRef.current.targetPitch = 0.05;
  }

  return (
    <div className={cn("relative w-full select-none overflow-hidden rounded-3xl border-[1.5px] border-ink bg-[#FFFDF9] shadow-sm", className)}>
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-80 sm:h-96 cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
      />

      {/* Floating Viewport Overlay Badge */}
      <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-card px-2.5 py-1 text-[11px] font-bold shadow-sm">
        <span className="h-2 w-2 rounded-full bg-mint animate-pulse" />
        <span>
          {modelType === "xbot"
            ? "Mixamo X-Bot 3D"
            : modelType === "michelle"
            ? "Mixamo Michelle 3D"
            : modelType === "soldier"
            ? "Soldier 3D"
            : modelType === "base"
            ? "3D Mannequin"
            : "Sculpted Croquis"}
        </span>
      </div>

      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-card/60 backdrop-blur-xs z-10">
          <Loader2 className="h-6 w-6 animate-spin text-ink" />
          <span className="mt-2 text-xs font-semibold text-ink">Loading 3D Model…</span>
        </div>
      )}

      {/* Turntable & Reset Controls (Top Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          className={cn(
            "rounded-full border-[1.5px] border-ink bg-card p-1.5 text-xs transition-colors hover:bg-muted active:scale-95 shadow-xs",
            autoRotate && "bg-sun"
          )}
          title={autoRotate ? "Pause Turntable" : "Auto-Rotate Turntable"}
        >
          <RotateCw className={cn("h-3.5 w-3.5", autoRotate && "animate-spin")} style={{ animationDuration: "3s" }} />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="rounded-full border-[1.5px] border-ink bg-card p-1.5 text-xs transition-colors hover:bg-muted active:scale-95 shadow-xs"
          title="Reset to Center & Default Zoom"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Vertical Zoom Controls (Floating Right Edge) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-ink bg-card/95 backdrop-blur-xs p-1 shadow-sm">
        <button
          type="button"
          onClick={handleZoomIn}
          className="rounded-xl p-1.5 text-foreground hover:bg-muted active:scale-90 transition-transform"
          title="Zoom In (or pinch / scroll)"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <div className="h-px w-3 bg-ink/20" />
        <button
          type="button"
          onClick={handleZoomOut}
          className="rounded-xl p-1.5 text-foreground hover:bg-muted active:scale-90 transition-transform"
          title="Zoom Out (or pinch / scroll)"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>

      {/* Quick View Angle Chips (Bottom Center) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-card/90 backdrop-blur-sm border-[1.5px] border-ink px-2 py-1 rounded-full shadow-sm">
        {(["front", "right", "back", "left"] as const).map((angle) => (
          <button
            key={angle}
            type="button"
            onClick={() => snapSide(angle)}
            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-muted/70 active:scale-95 text-foreground"
          >
            {angle}
          </button>
        ))}
      </div>

      {/* Touch Interaction Hint */}
      {isInteracting && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 text-center">
          <span className="rounded-full bg-ink/75 px-3 py-1 text-[10px] font-medium text-white shadow-md">
            Drag to rotate · Scroll or pinch to zoom
          </span>
        </div>
      )}
    </div>
  );
}
