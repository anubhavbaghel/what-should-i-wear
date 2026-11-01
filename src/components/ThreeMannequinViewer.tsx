import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCw, RefreshCw, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { cn } from "@/lib/utils";
import type { HairstyleType, EyewearType } from "./HairstyleGeometries";
export type { HairstyleType, EyewearType };

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

export type ModelPresetType = "/models/female-twin.glb" | "/models/male-twin.glb" | "female" | "male" | string;
export type CameraFocusTarget = "full" | "face" | "torso" | "legs" | "shoes";
export type FashionStanceType =
  | "runway_confident"
  | "casual_streetwear"
  | "editorial_chic"
  | "neutral_pose";

export interface ThreeMannequinViewerProps {
  modelType?: ModelPresetType;
  build?: BuildType;
  skinToneHex?: string;
  hairStyle?: HairstyleType;
  hairColorHex?: string;
  eyewear?: EyewearType;
  presentation?: StylePresentationType;
  baseWearHex?: string;
  heightScale?: number; // 0.9 to 1.1
  bodyMorphs?: BodyMorphConfig;
  className?: string;
  autoRotateDefault?: boolean;
  outfit?: MannequinOutfitConfig;
  cameraFocus?: CameraFocusTarget;
  stance?: FashionStanceType;
}

export function ThreeMannequinViewer({
  modelType = "/models/female-twin.glb",
  build = "neutral",
  skinToneHex = "#D59D7B",
  hairStyle = "wavy_curtains",
  hairColorHex = "#1E1E22",
  eyewear = "none",
  presentation = "neutral",
  baseWearHex = "#232326",
  heightScale = 1.0,
  bodyMorphs,
  className,
  autoRotateDefault = false,
  outfit,
  cameraFocus = "full",
  stance = "runway_confident",
}: ThreeMannequinViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(autoRotateDefault);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const externalModelGroupRef = useRef<THREE.Group | null>(null);
  const loadedModelRef = useRef<THREE.Object3D | null>(null);
  const isFemaleModelRef = useRef<boolean>(true);
  const modelBonesRef = useRef<Record<string, THREE.Bone>>({});
  const initialBoneQuatsRef = useRef<Record<string, THREE.Quaternion>>({});
  const modularMeshesRef = useRef<{
    head?: THREE.SkinnedMesh;
    body?: THREE.SkinnedMesh;
    hair?: THREE.SkinnedMesh;
    top?: THREE.SkinnedMesh;
    bottom?: THREE.SkinnedMesh;
    footwear?: THREE.SkinnedMesh;
    glasses?: THREE.SkinnedMesh;
    teeth?: THREE.SkinnedMesh;
    eyes: THREE.SkinnedMesh[];
  }>({ eyes: [] });
  const animFrameRef = useRef<number | null>(null);

  // Orbit, Camera Target & Zoom state (Snapchat dynamic auto-framing)
  const rotationRef = useRef({ y: 0, targetY: 0, pitch: 0.1, targetPitch: 0.1 });
  const zoomRef = useRef({ distance: 4.0, targetDistance: 4.0, min: 2.0, max: 6.2 });
  const cameraTargetRef = useRef<{
    y: number;
    targetY: number;
    distance: number;
    targetDistance: number;
  }>({
    y: 0.05,
    targetY: 0.05,
    distance: 4.0,
    targetDistance: 4.0,
  });
  const isPointerDownRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);

  // Dynamic Camera Auto-Framing when category focus changes (Snapchat Bitmoji feature)
  useEffect(() => {
    const target = cameraTargetRef.current;
    switch (cameraFocus) {
      case "face":
        target.targetY = 0.85;
        target.targetDistance = 2.4;
        break;
      case "torso":
        target.targetY = 0.35;
        target.targetDistance = 3.2;
        break;
      case "legs":
        target.targetY = -0.35;
        target.targetDistance = 3.2;
        break;
      case "shoes":
        target.targetY = -0.92;
        target.targetDistance = 2.5;
        break;
      case "full":
      default:
        target.targetY = 0.05;
        target.targetDistance = 4.0;
        break;
    }
  }, [cameraFocus]);

  // 3D Scene Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Soft warm studio gradient background
    scene.background = new THREE.Color("#FAF8F5");

    // 2. Camera setup
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0.2, 4.0);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    // Empty container before appending
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig - High-End Runway Fashion Studio
    const ambientLight = new THREE.AmbientLight(0xfffbf5, 0.95);
    scene.add(ambientLight);

    // Key Light (warm, soft shadows from top front-right)
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.45);
    keyLight.position.set(2.2, 3.8, 3.2);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 12;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Fill Light (cool, gentle fill from left)
    const fillLight = new THREE.DirectionalLight(0xe8f0fe, 0.7);
    fillLight.position.set(-3.0, 1.8, 2.0);
    scene.add(fillLight);

    // Rim / Back Light (crisp silhouette separation from behind)
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.1);
    rimLight.position.set(0, 3.0, -3.0);
    scene.add(rimLight);

    // Subtle Ground Bounce
    const hemiLight = new THREE.HemisphereLight(0xfff5eb, 0x3d3834, 0.45);
    scene.add(hemiLight);

    // 5. Stylized Runway Circular Pedestal
    const pedestalGroup = new THREE.Group();

    // Floor contact shadow disc
    const contactDiscGeo = new THREE.CircleGeometry(1.22, 64);
    const contactDiscMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.16,
    });
    const contactDisc = new THREE.Mesh(contactDiscGeo, contactDiscMat);
    contactDisc.rotation.x = -Math.PI / 2;
    contactDisc.position.y = -1.138;
    pedestalGroup.add(contactDisc);

    // Pedestal top platform
    const platformGeo = new THREE.CylinderGeometry(1.2, 1.25, 0.04, 64);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3ee,
      roughness: 0.35,
      metalness: 0.08,
    });
    const platformMesh = new THREE.Mesh(platformGeo, platformMat);
    platformMesh.position.y = -1.12;
    platformMesh.receiveShadow = true;
    pedestalGroup.add(platformMesh);

    // Soft Radial Gradient Floor Shadow
    try {
      const shadowCanvas = document.createElement("canvas");
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const ctx = shadowCanvas.getContext("2d");
      if (ctx) {
        const gradient = ctx.createRadialGradient(128, 128, 25, 128, 128, 120);
        gradient.addColorStop(0, "rgba(22, 22, 24, 0.28)");
        gradient.addColorStop(0.5, "rgba(22, 22, 24, 0.12)");
        gradient.addColorStop(1, "rgba(22, 22, 24, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
      }
      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowPlaneGeo = new THREE.PlaneGeometry(3.0, 3.0);
      const shadowPlaneMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -1.096;
      pedestalGroup.add(shadowPlane);
    } catch {
      // Fallback if canvas is unavailable
    }

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

    // External 3D Model Group (Twin Models)
    const externalModelGroup = new THREE.Group();
    externalModelGroupRef.current = externalModelGroup;
    scene.add(externalModelGroup);

    // Animation & Render Loop
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

      // Smooth camera position & framing damping (Snapchat dynamic auto-framing)
      const camTarget = cameraTargetRef.current;
      camTarget.y += (camTarget.targetY - camTarget.y) * 0.1;
      camTarget.distance += (camTarget.targetDistance - camTarget.distance) * 0.12;

      if (camera) {
        camera.position.y = camTarget.y + Math.sin(rot.pitch) * camTarget.distance;
        camera.position.z = Math.cos(rot.pitch) * camTarget.distance;
        camera.lookAt(0, camTarget.y, 0);
      }

      if (externalModelGroupRef.current) {
        externalModelGroupRef.current.rotation.y = rot.y;
        externalModelGroupRef.current.rotation.x = rot.pitch;
      }

      // Natural idle ARKit blinking & expression cycle (Bitmoji Vitality Engine)
      const nowSec = now / 1000;
      const blinkPeriod = 3.8;
      const blinkDuration = 0.16;
      const cycleTime = nowSec % blinkPeriod;
      let blinkVal = 0;
      if (cycleTime < blinkDuration) {
        blinkVal = Math.sin((cycleTime / blinkDuration) * Math.PI);
      }

      // Subtle natural breathing cycle on spine
      const breathOffset = Math.sin(nowSec * 2.0) * 0.012;
      const activeBones = modelBonesRef.current;
      const spine1InitQ = initialBoneQuatsRef.current.spine1;
      if (activeBones.spine1 && spine1InitQ) {
        const breathQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(breathOffset, 0, 0, "XYZ"));
        activeBones.spine1.quaternion.copy(spine1InitQ).multiply(breathQ);
      }

      const modMeshes = modularMeshesRef.current;
      if (modMeshes.head && modMeshes.head.morphTargetDictionary && modMeshes.head.morphTargetInfluences) {
        const dict = modMeshes.head.morphTargetDictionary;
        const inf = modMeshes.head.morphTargetInfluences;
        if (dict.eyeBlinkLeft !== undefined) inf[dict.eyeBlinkLeft] = blinkVal;
        if (dict.eyeBlinkRight !== undefined) inf[dict.eyeBlinkRight] = blinkVal;
        if (dict.mouthSmileLeft !== undefined) inf[dict.mouthSmileLeft] = 0.16;
        if (dict.mouthSmileRight !== undefined) inf[dict.mouthSmileRight] = 0.16;
        if (dict.mouthSmile !== undefined) inf[dict.mouthSmile] = 0.18;
      }

      if (modMeshes.eyes && modMeshes.eyes.length > 0) {
        modMeshes.eyes.forEach((eye) => {
          if (eye.morphTargetDictionary && eye.morphTargetInfluences) {
            const dict = eye.morphTargetDictionary;
            const inf = eye.morphTargetInfluences;
            if (dict.eyeBlinkLeft !== undefined) inf[dict.eyeBlinkLeft] = blinkVal;
            if (dict.eyeBlinkRight !== undefined) inf[dict.eyeBlinkRight] = blinkVal;
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Pointer Interaction Handlers (Touch & Mouse Turntable)
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isPointerDownRef.current = true;
      setIsInteracting(true);
      if ("touches" in e) {
        if (e.touches.length === 1) {
          pointerStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          pinchStartDistRef.current = Math.hypot(dx, dy);
        }
      } else {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isPointerDownRef.current) return;

      let currentX = 0;
      let currentY = 0;

      if ("touches" in e) {
        if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.hypot(dx, dy);
          const diff = (pinchStartDistRef.current - dist) * 0.008;
          pinchStartDistRef.current = dist;
          cameraTargetRef.current.targetDistance = Math.max(
            zoomRef.current.min,
            Math.min(zoomRef.current.max, cameraTargetRef.current.targetDistance + diff)
          );
          return;
        } else if (e.touches.length === 1) {
          currentX = e.touches[0].clientX;
          currentY = e.touches[0].clientY;
        }
      } else {
        currentX = e.clientX;
        currentY = e.clientY;
      }

      const deltaX = currentX - pointerStartRef.current.x;
      const deltaY = currentY - pointerStartRef.current.y;
      pointerStartRef.current = { x: currentX, y: currentY };

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
      const newDist = Math.max(
        zoomRef.current.min,
        Math.min(zoomRef.current.max, cameraTargetRef.current.targetDistance + zoomDelta)
      );
      cameraTargetRef.current.targetDistance = newDist;
      zoomRef.current.targetDistance = newDist;
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

  // Update modular stylized twin materials & garments
  const updateModularTwin = () => {
    const modMeshes = modularMeshesRef.current;
    if (!modMeshes.head && !modMeshes.body) return;

    // 1. Skin tone
    if (modMeshes.head?.material) {
      const mat = (Array.isArray(modMeshes.head.material) ? modMeshes.head.material[0] : modMeshes.head.material) as THREE.MeshStandardMaterial;
      if (mat && mat.color) mat.color.set(skinToneHex);
    }
    if (modMeshes.body?.material) {
      const mat = (Array.isArray(modMeshes.body.material) ? modMeshes.body.material[0] : modMeshes.body.material) as THREE.MeshStandardMaterial;
      if (mat && mat.color) mat.color.set(skinToneHex);
    }

    // 2. Hair
    if (modMeshes.hair) {
      modMeshes.hair.visible = hairStyle !== "none";
      if (modMeshes.hair.material) {
        const mat = (Array.isArray(modMeshes.hair.material) ? modMeshes.hair.material[0] : modMeshes.hair.material) as THREE.MeshStandardMaterial;
        if (mat && mat.color) mat.color.set(hairColorHex);
      }
    }

    // 3. Eyewear
    if (modMeshes.glasses) {
      modMeshes.glasses.visible = eyewear !== "none";
    }

    // 4. Tops
    if (modMeshes.top) {
      const isTopVisible = outfit?.topType !== "none";
      modMeshes.top.visible = isTopVisible;
      if (isTopVisible && outfit?.topColor && modMeshes.top.material) {
        const mat = (Array.isArray(modMeshes.top.material) ? modMeshes.top.material[0] : modMeshes.top.material) as THREE.MeshStandardMaterial;
        if (mat && mat.color) mat.color.set(outfit.topColor);
      }
    }

    // 5. Bottoms
    if (modMeshes.bottom) {
      const isBottomVisible = outfit?.bottomType !== "none";
      modMeshes.bottom.visible = isBottomVisible;
      if (isBottomVisible && outfit?.bottomColor && modMeshes.bottom.material) {
        const mat = (Array.isArray(modMeshes.bottom.material) ? modMeshes.bottom.material[0] : modMeshes.bottom.material) as THREE.MeshStandardMaterial;
        if (mat && mat.color) mat.color.set(outfit.bottomColor);
      }
    }

    // 6. Footwear
    if (modMeshes.footwear) {
      const isShoesVisible = outfit?.shoesType !== "none";
      modMeshes.footwear.visible = isShoesVisible;
      if (isShoesVisible && outfit?.shoesColor && modMeshes.footwear.material) {
        const mat = (Array.isArray(modMeshes.footwear.material) ? modMeshes.footwear.material[0] : modMeshes.footwear.material) as THREE.MeshStandardMaterial;
        if (mat && mat.color) mat.color.set(outfit.shoesColor);
      }
    }
  };

  // Load external 3D model (Stylized Twin Models)
  useEffect(() => {
    const extGroup = externalModelGroupRef.current;
    if (!extGroup) return;

    // Resolve model URL: Only Stylized Female Twin and Stylized Male Twin exist
    const isMale =
      modelType === "male" ||
      modelType === "/models/male-twin.glb" ||
      modelType === "soldier" ||
      modelType === "xbot" ||
      (modelType !== "female" && modelType !== "/models/female-twin.glb" && presentation === "masculine");
    const effectiveUrl = isMale ? "/models/male-twin.glb" : "/models/female-twin.glb";
    isFemaleModelRef.current = !isMale;

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

      const boneMap: Record<string, THREE.Bone> = {};
      const initialQuats: Record<string, THREE.Quaternion> = {};
      const meshes: {
        head?: THREE.SkinnedMesh;
        body?: THREE.SkinnedMesh;
        hair?: THREE.SkinnedMesh;
        top?: THREE.SkinnedMesh;
        bottom?: THREE.SkinnedMesh;
        footwear?: THREE.SkinnedMesh;
        glasses?: THREE.SkinnedMesh;
        teeth?: THREE.SkinnedMesh;
        eyes: THREE.SkinnedMesh[];
      } = { eyes: [] };

      obj.traverse((child) => {
        if ((child as THREE.Bone).isBone) {
          const raw = child.name.replace("mixamorig:", "").replace("mixamorig", "").replace("_", "").toLowerCase();
          boneMap[raw] = child as THREE.Bone;
          initialQuats[raw] = child.quaternion.clone();
        }
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.SkinnedMesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Clone materials so tinting doesn't bleed across models
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => m.clone());
          } else if (mesh.material) {
            mesh.material = mesh.material.clone();
          }

          const name = mesh.name;
          if (name === "Wolf3D_Head") meshes.head = mesh;
          else if (name === "Wolf3D_Body") meshes.body = mesh;
          else if (name === "Wolf3D_Hair") meshes.hair = mesh;
          else if (name === "Wolf3D_Outfit_Top") meshes.top = mesh;
          else if (name === "Wolf3D_Outfit_Bottom") meshes.bottom = mesh;
          else if (name === "Wolf3D_Outfit_Footwear") meshes.footwear = mesh;
          else if (name === "Wolf3D_Glasses") meshes.glasses = mesh;
          else if (name === "Wolf3D_Teeth") meshes.teeth = mesh;
          else if (name === "EyeLeft" || name === "EyeRight") meshes.eyes.push(mesh);
        }
      });

      modelBonesRef.current = boneMap;
      initialBoneQuatsRef.current = initialQuats;
      modularMeshesRef.current = meshes;
    }

    let isCancelled = false;
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      effectiveUrl,
      (gltf) => {
        if (isCancelled) return;
        applyTransformsAndMaterials(gltf.scene);
        extGroup.clear();
        extGroup.add(gltf.scene);
        extGroup.visible = true;
        loadedModelRef.current = gltf.scene;
        setIsLoadingModel(false);
        applyFashionStance(stance);
        updateModularTwin();
      },
      undefined,
      (err) => {
        console.warn(`GLTF load failed for ${effectiveUrl}:`, err);
        if (isCancelled) return;
        setIsLoadingModel(false);
      }
    );

    return () => {
      isCancelled = true;
    };
  }, [modelType, presentation]);

  // Apply fashion model stances & postures (Mixamo / Ready Player Me compatible armature)
  function applyFashionStance(activeStance: FashionStanceType) {
    const bones = modelBonesRef.current;
    const initQuats = initialBoneQuatsRef.current;
    if (Object.keys(bones).length > 0) {
      // 1. Restore all bones to their natural glTF bind quaternion (prevents leg inversions!)
      Object.entries(bones).forEach(([name, b]) => {
        const initQ = initQuats[name];
        if (initQ) {
          b.quaternion.copy(initQ);
        }
      });

      function rotateBone(name: string, rx: number, ry: number, rz: number) {
        const b = bones[name];
        const initQ = initQuats[name];
        if (b && initQ) {
          const deltaQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, "XYZ"));
          b.quaternion.copy(initQ).multiply(deltaQ);
        }
      }

      // Base arm X offset: Female bind is horizontal T-pose (+1.18 rad brings arms down beside hips);
      // Male bind is already a relaxed standing A-pose (+0.05 rad keeps arms perfectly natural).
      const baseArmX = isFemaleModelRef.current ? 1.18 : 0.05;

      if (activeStance === "runway_confident") {
        rotateBone("hips", 0, 0.06, -0.03);
        rotateBone("spine1", 0, -0.04, 0.02);
        rotateBone("head", 0.02, -0.06, 0.02);
        rotateBone("leftarm", baseArmX + 0.06, 0.04, 0);
        rotateBone("leftforearm", 0.12, 0, 0.18);
        rotateBone("rightarm", baseArmX + 0.02, -0.04, 0);
        rotateBone("rightforearm", -0.12, 0, -0.18);
      } else if (activeStance === "casual_streetwear") {
        rotateBone("hips", 0, -0.04, 0.02);
        rotateBone("spine1", 0.02, 0.02, -0.01);
        rotateBone("head", -0.02, 0.05, 0);
        rotateBone("leftarm", baseArmX + 0.08, 0, 0);
        rotateBone("leftforearm", 0.18, 0, 0.22);
        rotateBone("rightarm", baseArmX + 0.08, 0, 0);
        rotateBone("rightforearm", -0.18, 0, -0.22);
      } else if (activeStance === "editorial_chic") {
        rotateBone("hips", 0, 0.08, -0.04);
        rotateBone("spine1", 0, -0.06, 0.02);
        rotateBone("head", 0.04, -0.08, 0.03);
        rotateBone("leftarm", baseArmX + 0.03, 0.05, 0);
        rotateBone("leftforearm", 0.22, 0, 0.25);
        rotateBone("rightarm", baseArmX - 0.04, -0.05, 0);
        rotateBone("rightforearm", -0.1, 0, -0.15);
      } else {
        // neutral_pose: Natural standing A-pose beside hips
        rotateBone("leftarm", baseArmX, 0, 0);
        rotateBone("rightarm", baseArmX, 0, 0);
        rotateBone("leftforearm", 0.1, 0, 0.1);
        rotateBone("rightforearm", -0.1, 0, -0.1);
      }
    }
  }

  useEffect(() => {
    applyFashionStance(stance);
  }, [stance, modelType]);

  // Update materials, proportions and height when styling or outfit changes
  useEffect(() => {
    updateModularTwin();
    if (externalModelGroupRef.current) {
      externalModelGroupRef.current.scale.set(1.0, heightScale, 1.0);
    }
  }, [skinToneHex, heightScale, outfit, hairStyle, hairColorHex, eyewear]);

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
        <span>Stylized Digital Twin</span>
      </div>

      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-card/60 backdrop-blur-xs z-10">
          <Loader2 className="h-6 w-6 animate-spin text-ink" />
          <span className="mt-2 text-xs font-semibold text-ink">Loading 3D Twin…</span>
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
