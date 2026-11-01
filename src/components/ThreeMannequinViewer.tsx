import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RefreshCw, Plus, Minus, Undo2, Loader2 } from "lucide-react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { cn } from "@/lib/utils";
import type { HairstyleType, EyewearType } from "./HairstyleGeometries";
import {
  BodyMorphConfig,
  MannequinOutfitConfig,
  TopGarmentType,
  BottomGarmentType,
  ShoesGarmentType,
  CameraFocusTarget,
  FashionStanceType,
  BuildType,
  StylePresentation as StylePresentationType,
} from "@/lib/avatar.types";
import {
  captureSkeletonBaselines,
  applyAvatarTransformations,
  type SkeletonBaselines,
  type ModelBones,
} from "@/lib/avatar-transform";

export type {
  HairstyleType,
  EyewearType,
  BuildType,
  StylePresentationType,
  TopGarmentType,
  BottomGarmentType,
  ShoesGarmentType,
  MannequinOutfitConfig,
  BodyMorphConfig,
  CameraFocusTarget,
  FashionStanceType,
};

export type ModelPresetType = "/models/female-twin.glb" | "/models/male-twin.glb" | "female" | "male" | string;

export interface ThreeMannequinViewerProps {
  modelType?: ModelPresetType;
  build?: BuildType;
  skinToneHex?: string;
  hairStyle?: HairstyleType;
  hairColorHex?: string;
  eyewear?: EyewearType;
  presentation?: StylePresentationType;
  baseWearHex?: string;
  heightScale?: number; // 0.88 to 1.12
  bodyMorphs?: BodyMorphConfig;
  className?: string;
  autoRotateDefault?: boolean;
  outfit?: MannequinOutfitConfig;
  cameraFocus?: CameraFocusTarget;
  stance?: FashionStanceType;
  onUndo?: () => void;
  onFocusChange?: (focus: CameraFocusTarget) => void;
  showFocusTabs?: boolean;
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
  onUndo,
  onFocusChange,
  showFocusTabs = true,
}: ThreeMannequinViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(autoRotateDefault);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [activeFocus, setActiveFocus] = useState<CameraFocusTarget>(cameraFocus);

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const externalModelGroupRef = useRef<THREE.Group | null>(null);
  const loadedModelRef = useRef<THREE.Object3D | null>(null);
  const isFemaleModelRef = useRef<boolean>(true);

  // Armature Transform Cache (Deterministic Bind Poses)
  const baselinesRef = useRef<SkeletonBaselines | null>(null);
  const modelBonesRef = useRef<ModelBones>({});
  const spine1StanceQuatRef = useRef<THREE.Quaternion | null>(null);
  const heightPivotGroupRef = useRef<THREE.Group | null>(null);

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

  useEffect(() => {
    setActiveFocus(cameraFocus);
  }, [cameraFocus]);

  // Dynamic Camera Auto-Framing when category focus changes
  useEffect(() => {
    const target = cameraTargetRef.current;
    switch (activeFocus) {
      case "face":
        target.targetY = 0.85;
        target.targetDistance = 2.4;
        break;
      case "torso":
        target.targetY = 0.35;
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
  }, [activeFocus]);

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
      // Fallback
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

    // External 3D Model Group
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

      if (autoRotate && !isPointerDownRef.current) {
        rot.targetY += delta * 0.6;
      }

      rot.y += (rot.targetY - rot.y) * 0.12;
      rot.pitch += (rot.targetPitch - rot.pitch) * 0.12;

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

      // Idle ARKit blinking & expression cycle
      const nowSec = now / 1000;
      const blinkPeriod = 3.8;
      const blinkDuration = 0.16;
      const cycleTime = nowSec % blinkPeriod;
      let blinkVal = 0;
      if (cycleTime < blinkDuration) {
        blinkVal = Math.sin((cycleTime / blinkDuration) * Math.PI);
      }

      const breathOffset = Math.sin(nowSec * 2.0) * 0.012;
      const activeBones = modelBonesRef.current;
      const spine1StanceQ = spine1StanceQuatRef.current;
      if (activeBones.spine1 && spine1StanceQ) {
        const breathQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(breathOffset, 0, 0, "XYZ"));
        activeBones.spine1.quaternion.copy(spine1StanceQ).multiply(breathQ);
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

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

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

  const updateModularTwin = () => {
    const modMeshes = modularMeshesRef.current;
    if (!modMeshes.head && !modMeshes.body) return;

    if (modMeshes.head?.material) {
      const mat = (Array.isArray(modMeshes.head.material) ? modMeshes.head.material[0] : modMeshes.head.material) as THREE.MeshStandardMaterial;
      if (mat && mat.color) mat.color.set(skinToneHex);
    }
    if (modMeshes.body?.material) {
      const mat = (Array.isArray(modMeshes.body.material) ? modMeshes.body.material[0] : modMeshes.body.material) as THREE.MeshStandardMaterial;
      if (mat && mat.color) mat.color.set(skinToneHex);
    }

    if (modMeshes.hair) {
      modMeshes.hair.visible = hairStyle !== "none";
      if (modMeshes.hair.material) {
        const mat = (Array.isArray(modMeshes.hair.material) ? modMeshes.hair.material[0] : modMeshes.hair.material) as THREE.MeshStandardMaterial;
        if (mat && mat.color) mat.color.set(hairColorHex);
      }
    }

    if (modMeshes.glasses) {
      modMeshes.glasses.visible = eyewear !== "none";
    }

    if (modMeshes.top) {
      const isTopVisible = outfit?.topType !== "none";
      modMeshes.top.visible = isTopVisible;
      if (isTopVisible && outfit?.topColor && modMeshes.top.material) {
        const mat = (Array.isArray(modMeshes.top.material) ? modMeshes.top.material[0] : modMeshes.top.material) as THREE.MeshStandardMaterial;
        if (mat && mat.color) mat.color.set(outfit.topColor);
      }
    }

    if (modMeshes.bottom) {
      const isBottomVisible = outfit?.bottomType !== "none";
      modMeshes.bottom.visible = isBottomVisible;
      if (isBottomVisible && outfit?.bottomColor && modMeshes.bottom.material) {
        const mat = (Array.isArray(modMeshes.bottom.material) ? modMeshes.bottom.material[0] : modMeshes.bottom.material) as THREE.MeshStandardMaterial;
        if (mat && mat.color) mat.color.set(outfit.bottomColor);
      }
    }

    if (modMeshes.footwear) {
      const isShoesVisible = outfit?.shoesType !== "none";
      modMeshes.footwear.visible = isShoesVisible;
      if (isShoesVisible && outfit?.shoesColor && modMeshes.footwear.material) {
        const mat = (Array.isArray(modMeshes.footwear.material) ? modMeshes.footwear.material[0] : modMeshes.footwear.material) as THREE.MeshStandardMaterial;
        if (mat && mat.color) mat.color.set(outfit.shoesColor);
      }
    }
  };

  /**
   * Applies deterministic real-time body proportions and stance to the skeleton.
   * Derived purely from the immutable baselines captured upon model load.
   */
  function applyTransformations() {
    const bones = modelBonesRef.current;
    const baselines = baselinesRef.current;
    if (!bones || !baselines || Object.keys(bones).length === 0) return;

    const { spine1StanceQuat } = applyAvatarTransformations(
      bones,
      baselines,
      {
        bodyMorphs,
        stance,
        heightScale,
      },
      { isFemale: isFemaleModelRef.current }
    );
    spine1StanceQuatRef.current = spine1StanceQuat || null;

    if (heightPivotGroupRef.current) {
      heightPivotGroupRef.current.scale.set(1.0, heightScale, 1.0);
    }
  }

  useEffect(() => {
    const extGroup = externalModelGroupRef.current;
    if (!extGroup) return;

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
    const targetGroundY = -1.12;

    function applyTransformsAndMaterials(obj: THREE.Object3D) {
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      box.getSize(size);
      if (size.y > 0) {
        const scale = targetHeight / size.y;
        obj.scale.setScalar(scale);
        box.setFromObject(obj);
        // Anchor model so lowest contact point is at y = 0 inside heightPivotGroup
        obj.position.y = -box.min.y;
        obj.position.x = 0;
        obj.position.z = 0;
      }

      const { bones, baselines } = captureSkeletonBaselines(
        obj,
        effectiveUrl,
        targetGroundY,
        targetHeight
      );
      modelBonesRef.current = bones;
      baselinesRef.current = baselines;

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
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.SkinnedMesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

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

      modularMeshesRef.current = meshes;
    }

    let isCancelled = false;
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      effectiveUrl,
      (gltf) => {
        if (isCancelled) return;
        applyTransformsAndMaterials(gltf.scene);

        // Ground anchor pivot group (feet pinned to targetGroundY)
        const heightPivotGroup = new THREE.Group();
        heightPivotGroup.position.set(0, targetGroundY, 0);
        heightPivotGroup.scale.set(1.0, heightScale, 1.0);
        heightPivotGroup.add(gltf.scene);
        heightPivotGroupRef.current = heightPivotGroup;

        extGroup.clear();
        extGroup.add(heightPivotGroup);
        extGroup.visible = true;
        loadedModelRef.current = gltf.scene;

        setIsLoadingModel(false);
        applyTransformations();
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

  // Re-apply deterministic body transformations whenever bodyMorphs, stance, or heightScale change
  useEffect(() => {
    applyTransformations();
  }, [bodyMorphs, stance, heightScale, build]);

  useEffect(() => {
    updateModularTwin();
  }, [skinToneHex, outfit, hairStyle, hairColorHex, eyewear]);

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

  return (
    <div className={cn("relative w-full h-full min-h-[300px] select-none overflow-hidden rounded-3xl border-2 border-ink bg-[#FFFDF9] shadow-xs", className)}>
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
      />

      {/* Top Left: Camera Focus Segmented Pills (Full, Face, Torso, Shoes) */}
      {showFocusTabs && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1 rounded-full border border-ink bg-white/95 p-1 shadow-xs backdrop-blur-xs">
          {(["full", "face", "torso", "shoes"] as const).map((f) => {
            const isCurrent = activeFocus === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setActiveFocus(f);
                  onFocusChange?.(f);
                }}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-extrabold capitalize transition-all",
                  isCurrent
                    ? "bg-ink text-white shadow-xs"
                    : "text-ink hover:bg-neutral-100"
                )}
              >
                {f}
              </button>
            );
          })}
        </div>
      )}

      {/* Top Right: Undo ↺ & Reset ↻ Circular Buttons */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink bg-white text-ink shadow-xs transition-transform hover:bg-neutral-100 active:scale-95"
            title="Undo"
            aria-label="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={resetView}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink bg-white text-ink shadow-xs transition-transform hover:bg-neutral-100 active:scale-95"
          title="Reset View"
          aria-label="Reset View"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Right Edge: Vertical Zoom Controls (+ / -) */}
      <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-full border border-ink bg-white/95 p-1 shadow-xs backdrop-blur-xs">
        <button
          type="button"
          onClick={handleZoomIn}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition-transform hover:bg-neutral-100 active:scale-90"
          title="Zoom In"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
        </button>
        <div className="h-px w-3 bg-ink/20" />
        <button
          type="button"
          onClick={handleZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition-transform hover:bg-neutral-100 active:scale-90"
          title="Zoom Out"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom Center: Drag to Rotate & Scroll to Zoom Pill */}
      <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
        <div className="flex items-center gap-1.5 rounded-full border border-ink bg-white/95 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink shadow-xs backdrop-blur-xs">
          <span>✦ DRAG TO ROTATE 360°</span>
          <span className="text-ink/40">·</span>
          <span>SCROLL TO ZOOM ✦</span>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-card/60 backdrop-blur-xs">
          <Loader2 className="h-6 w-6 animate-spin text-ink" />
          <span className="mt-2 text-xs font-bold text-ink">Loading 3D Twin…</span>
        </div>
      )}
    </div>
  );
}
