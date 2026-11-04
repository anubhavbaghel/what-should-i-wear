import React, { useState, useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";
import type {
  BuildType,
  StylePresentation as StylePresentationType,
  TopGarmentType,
  BottomGarmentType,
  ShoesGarmentType,
  MannequinOutfitConfig,
  BodyMorphConfig,
  CameraFocusTarget,
  FashionStanceType,
  FacialExpressionType,
} from "@/lib/avatar.types";
import type { HairstyleType, EyewearType } from "./HairstyleGeometries";
import { Sparkles, Layers, Compass } from "lucide-react";

export type ViewAngleType = "front" | "three_quarters" | "back";

export interface Layered25DViewerProps {
  modelType?: string;
  build?: BuildType;
  skinToneHex?: string;
  hairStyle?: string | HairstyleType;
  hairColorHex?: string;
  eyewear?: string | EyewearType;
  presentation?: StylePresentationType;
  baseWearHex?: string;
  heightScale?: number; // 0.88 to 1.12
  bodyMorphs?: BodyMorphConfig;
  className?: string;
  outfit?: MannequinOutfitConfig;
  cameraFocus?: CameraFocusTarget;
  stance?: FashionStanceType;
  onFocusChange?: (focus: CameraFocusTarget) => void;
  facialExpression?: FacialExpressionType;
  sheetState?: "collapsed" | "expanded";
}

/**
 * Calculates a lighter / darker shade for shading and highlights
 */
function adjustColor(hex: string, amount: number): string {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return hex;
  const num = parseInt(cleanHex, 16);
  let r = (num >> 16) + amount;
  let g = ((num >> 8) & 0x00ff) + amount;
  let b = (num & 0x0000ff) + amount;
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function Layered25DViewer({
  skinToneHex = "#D59D7B",
  hairStyle = "wavy_curtains",
  hairColorHex = "#1E1E22",
  eyewear = "none",
  presentation = "neutral",
  baseWearHex = "#232326",
  heightScale = 1.0,
  bodyMorphs,
  className,
  outfit,
  cameraFocus = "full",
  stance = "runway_confident",
  facialExpression = "neutral",
  sheetState = "collapsed",
}: Layered25DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax tilt offsets (-1 to 1 range)
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [viewAngle, setViewAngle] = useState<ViewAngleType>("front");
  const [isHovered, setIsHovered] = useState(false);

  // Extract garment types & colors
  const topType: TopGarmentType = outfit?.topType || "tee";
  const topColor = outfit?.topColor || "#FFFFFF";
  const bottomType: BottomGarmentType = outfit?.bottomType || "trousers";
  const bottomColor = outfit?.bottomColor || "#1E1E22";
  const shoesType: ShoesGarmentType = outfit?.shoesType || "sneakers";
  const shoesColor = outfit?.shoesColor || "#FAFAFA";

  // Dynamic morphological scales
  const shoulderScale = bodyMorphs?.shoulderWidth ?? 1.0;
  const waistScale = bodyMorphs?.waistScale ?? 1.0;
  const chestScale = bodyMorphs?.chestBust ?? 1.0;
  const hipScale = bodyMorphs?.hipWidth ?? 1.0;

  // Derived shaded palettes
  const skinHighlight = useMemo(() => adjustColor(skinToneHex, 24), [skinToneHex]);
  const skinShadow = useMemo(() => adjustColor(skinToneHex, -32), [skinToneHex]);
  const skinDeepShadow = useMemo(() => adjustColor(skinToneHex, -55), [skinToneHex]);

  const hairHighlight = useMemo(() => adjustColor(hairColorHex, 35), [hairColorHex]);
  const hairShadow = useMemo(() => adjustColor(hairColorHex, -25), [hairColorHex]);

  const topHighlight = useMemo(() => adjustColor(topColor, 20), [topColor]);
  const topShadow = useMemo(() => adjustColor(topColor, -35), [topColor]);

  const bottomHighlight = useMemo(() => adjustColor(bottomColor, 20), [bottomColor]);
  const bottomShadow = useMemo(() => adjustColor(bottomColor, -35), [bottomColor]);

  const shoesHighlight = useMemo(() => adjustColor(shoesColor, 20), [shoesColor]);
  const shoesShadow = useMemo(() => adjustColor(shoesColor, -30), [shoesColor]);

  // Handle interactive 2.5D mouse/touch parallax
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1
    setTilt({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    // Smoothly settle back to neutral
    setTilt({ x: 0, y: 0 });
  };

  // Device orientation gyro support for mobile 2.5D tactile parallax
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma: left-to-right (-90 to 90), beta: front-to-back (-180 to 180)
        const gx = Math.max(-1, Math.min(1, e.gamma / 30));
        const gy = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
        setTilt({ x: gx, y: gy });
      }
    };

    if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation);
      return () => window.removeEventListener("deviceorientation", handleOrientation);
    }
  }, []);

  // Compute camera framing transform based on cameraFocus and sheetState
  const cameraTransform = useMemo(() => {
    let scale = 1.0;
    let translateY = 0;
    let transformOrigin = "50% 50%";

    if (cameraFocus === "face") {
      scale = 2.2;
      translateY = 32; // shift down so head is centered
      transformOrigin = "50% 18%";
    } else if (cameraFocus === "torso") {
      scale = 1.65;
      translateY = 8;
      transformOrigin = "50% 38%";
    } else if (cameraFocus === "shoes") {
      scale = 1.85;
      translateY = -28;
      transformOrigin = "50% 88%";
    } else {
      // "full"
      if (sheetState === "expanded") {
        // Mobile bottom sheet is expanded (46vh), scale down and elevate
        scale = 0.76;
        translateY = -14;
        transformOrigin = "50% 45%";
      } else {
        scale = 0.95;
        translateY = 1;
        transformOrigin = "50% 50%";
      }
    }

    return {
      transform: `scale(${scale * heightScale}) translateY(${translateY}%)`,
      transformOrigin,
    };
  }, [cameraFocus, sheetState, heightScale]);

  // Dynamic parallax layer shifts
  // Deeper layers move less; foreground layers move more
  const pShadow = { x: -tilt.x * 6, y: -tilt.y * 3 };
  const pBody = { x: tilt.x * 3, y: tilt.y * 2 };
  const pBottoms = { x: tilt.x * 5, y: tilt.y * 3 };
  const pTops = { x: tilt.x * 7, y: tilt.y * 4 };
  const pOuterwear = { x: tilt.x * 9, y: tilt.y * 5 };
  const pFace = { x: tilt.x * 4, y: tilt.y * 2.5 };
  const pHairFront = { x: tilt.x * 9, y: tilt.y * 4.5 };
  const pEyewear = { x: tilt.x * 12, y: tilt.y * 6 };

  const isFeminine = presentation === "feminine";
  const isMasculine = presentation === "masculine";

  // Stance horizontal offset / rotation flavor
  const stancePoseTransform = useMemo(() => {
    switch (stance) {
      case "runway_confident":
        return "rotate(0.5deg) skewX(-0.5deg)";
      case "casual_streetwear":
        return "rotate(-1deg) translateY(2px)";
      case "editorial_chic":
        return "rotate(1.5deg) skewX(1deg)";
      case "neutral_pose":
      default:
        return "none";
    }
  }, [stance]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      className={cn(
        "relative w-full h-full select-none overflow-hidden flex items-center justify-center bg-gradient-to-b from-neutral-50/50 via-white to-neutral-100/60",
        className,
      )}
    >
      {/* 2.5D Studio Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft overhead fashion studio spotlight */}
        <div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[550px] rounded-full blur-3xl opacity-40 pointer-events-none transition-transform duration-700 ease-out"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(240,240,245,0.4) 60%, transparent 80%)",
            transform: `translate(calc(-50% + ${tilt.x * 15}px), ${tilt.y * 10}px)`,
          }}
        />
        {/* Studio floor ground line */}
        <div className="absolute bottom-[8%] inset-x-0 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent" />
      </div>

      {/* Discrete Runway Angle Switcher Pill (Chic Fashion Lookbook Control) */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1 rounded-full border border-black/[0.06] bg-white/80 p-1 shadow-xs backdrop-blur-md transition-opacity">
        <button
          type="button"
          onClick={() => setViewAngle("front")}
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase transition-all",
            viewAngle === "front"
              ? "bg-neutral-900 text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-900",
          )}
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => setViewAngle("three_quarters")}
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase transition-all",
            viewAngle === "three_quarters"
              ? "bg-neutral-900 text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-900",
          )}
        >
          3/4 Angle
        </button>
        <button
          type="button"
          onClick={() => setViewAngle("back")}
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase transition-all",
            viewAngle === "back"
              ? "bg-neutral-900 text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-900",
          )}
        >
          Back
        </button>
      </div>

      {/* Parallax Status Badge */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-black/[0.04] bg-neutral-900/5 px-2.5 py-1 text-[10px] font-medium text-neutral-600 backdrop-blur-xs pointer-events-none">
        <Layers className="h-3 w-3 text-neutral-500" />
        <span>2.5D Depth Engine</span>
      </div>

      {/* Main 2.5D Layer Stack Stage */}
      <div
        className="relative w-full max-w-[420px] h-[85vh] max-h-[780px] flex items-center justify-center transition-transform duration-500 ease-out"
        style={cameraTransform}
      >
        <svg
          viewBox="0 0 400 800"
          className="w-full h-full overflow-visible transition-transform duration-300"
          style={{ transform: stancePoseTransform }}
        >
          <defs>
            {/* Skin Tone Shading Gradient */}
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={skinHighlight} />
              <stop offset="55%" stopColor={skinToneHex} />
              <stop offset="100%" stopColor={skinShadow} />
            </linearGradient>

            <linearGradient id="skinContour" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={skinShadow} stopOpacity="0.45" />
              <stop offset="50%" stopColor={skinToneHex} stopOpacity="0" />
              <stop offset="100%" stopColor={skinShadow} stopOpacity="0.45" />
            </linearGradient>

            {/* Hair Shading Gradient */}
            <linearGradient id="hairGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor={hairHighlight} />
              <stop offset="60%" stopColor={hairColorHex} />
              <stop offset="100%" stopColor={hairShadow} />
            </linearGradient>

            {/* Top Garment Gradient */}
            <linearGradient id="topGrad" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor={topHighlight} />
              <stop offset="50%" stopColor={topColor} />
              <stop offset="100%" stopColor={topShadow} />
            </linearGradient>

            {/* Bottom Garment Gradient */}
            <linearGradient id="bottomGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor={bottomHighlight} />
              <stop offset="60%" stopColor={bottomColor} />
              <stop offset="100%" stopColor={bottomShadow} />
            </linearGradient>

            {/* Shoes Gradient */}
            <linearGradient id="shoesGrad" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor={shoesHighlight} />
              <stop offset="70%" stopColor={shoesColor} />
              <stop offset="100%" stopColor={shoesShadow} />
            </linearGradient>

            {/* Floor Radial Shadow */}
            <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 0, 0, 0.35)" />
              <stop offset="65%" stopColor="rgba(0, 0, 0, 0.12)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </radialGradient>

            {/* Soft Fabric Drop Shadow */}
            <filter id="garmentShadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow
                dx="0"
                dy="4"
                stdDeviation="3.5"
                floodColor="#000000"
                floodOpacity="0.18"
              />
            </filter>

            {/* Subtle Eyewear Cast Shadow */}
            <filter id="eyewearShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2"
                floodColor="#000000"
                floodOpacity="0.25"
              />
            </filter>
          </defs>

          {/* =================================================================
              LAYER 1: GROUND SHADOW PLANE (Parallax: inverse shift)
              ================================================================= */}
          <g
            className="transition-transform duration-150 ease-out"
            style={{
              transform: `translate(${pShadow.x}px, ${pShadow.y}px)`,
            }}
          >
            <ellipse cx="200" cy="746" rx="82" ry="12" fill="url(#groundShadow)" />
          </g>

          {/* =================================================================
              LAYER 2: BACK HAIR (For long or voluminous hair styles)
              ================================================================= */}
          {viewAngle !== "back" &&
            (hairStyle === "long_waves" || hairStyle === "center_part_bob") && (
              <g
                className="transition-transform duration-200 ease-out"
                style={{
                  transform: `translate(${pBody.x * 0.7}px, ${pBody.y * 0.7}px)`,
                }}
              >
                {hairStyle === "long_waves" && (
                  <path
                    d="M142 120 C130 170 125 240 135 320 C145 350 160 370 170 380 C155 350 148 280 152 200 C154 160 160 130 165 110 Z
                     M258 120 C270 170 275 240 265 320 C255 350 240 370 230 380 C245 350 252 280 248 200 C246 160 240 130 235 110 Z"
                    fill="url(#hairGrad)"
                    opacity="0.95"
                  />
                )}
                {hairStyle === "center_part_bob" && (
                  <path
                    d="M145 125 C136 160 134 200 142 245 C150 240 156 220 158 180 Z
                     M255 125 C264 160 266 200 258 245 C250 240 244 220 242 180 Z"
                    fill="url(#hairGrad)"
                    opacity="0.95"
                  />
                )}
              </g>
            )}

          {/* =================================================================
              LAYER 3: BASE MANNEQUIN ANATOMY (Skin & Body Contours)
              ================================================================= */}
          <g
            className="transition-transform duration-200 ease-out"
            style={{
              transform: `translate(${pBody.x}px, ${pBody.y}px)`,
            }}
          >
            {/* Dynamic Morph Transform for Torso & Silhouette */}
            <g
              style={{
                transformOrigin: "200px 300px",
                transform: `scaleX(${shoulderScale * (viewAngle === "three_quarters" ? 0.92 : 1)})`,
              }}
            >
              {/* Head & Neck Base */}
              <path
                d="M188 140 L188 190 C188 196 193 200 200 200 C207 200 212 196 212 190 L212 140 Z"
                fill="url(#skinGrad)"
              />
              {/* Neck contour shading */}
              <path
                d="M188 155 Q200 168 212 155 L212 185 Q200 195 188 185 Z"
                fill={skinShadow}
                opacity="0.25"
              />

              {/* Head Egg/Oval */}
              <ellipse cx="200" cy="115" rx="34" ry="44" fill="url(#skinGrad)" />
              {/* Head 3D contour shadow */}
              <ellipse cx="200" cy="115" rx="34" ry="44" fill="url(#skinContour)" opacity="0.6" />

              {/* Ears */}
              <ellipse cx="164" cy="118" rx="4.5" ry="9" fill="url(#skinGrad)" />
              <ellipse cx="236" cy="118" rx="4.5" ry="9" fill="url(#skinGrad)" />

              {/* Clavicle / Shoulders & Torso Silhouette */}
              {isFeminine ? (
                /* Feminine graceful curvature */
                <path
                  d="M188 190 C170 194 142 205 130 225 C122 238 126 270 132 320 C136 350 148 400 156 430 C162 450 170 470 185 478 L215 478 C230 470 238 450 244 430 C252 400 264 350 268 320 C274 270 278 238 270 225 C258 205 230 194 212 190 Z"
                  fill="url(#skinGrad)"
                />
              ) : isMasculine ? (
                /* Masculine athletic shoulder V-taper */
                <path
                  d="M188 190 C165 194 130 204 118 222 C110 236 114 270 120 320 C126 350 142 395 152 425 C160 450 170 472 186 476 L214 476 C230 472 240 450 248 425 C258 395 274 350 280 320 C286 270 290 236 282 222 C270 204 235 194 212 190 Z"
                  fill="url(#skinGrad)"
                />
              ) : (
                /* Sleek Neutral Modern Mannequin */
                <path
                  d="M188 190 C168 194 136 205 124 224 C116 237 120 270 126 320 C131 350 145 400 154 428 C161 450 170 472 186 476 L214 476 C230 472 239 450 246 428 C255 400 269 350 274 320 C280 270 284 237 276 224 C264 205 232 194 212 190 Z"
                  fill="url(#skinGrad)"
                />
              )}

              {/* Collarbones (Clavicle lines) */}
              <path
                d="M190 204 Q170 206 148 214 M210 204 Q230 206 252 214"
                stroke={skinShadow}
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.45"
                fill="none"
              />

              {/* Arms (Resting along torso) */}
              {/* Left Arm */}
              <path
                d="M124 228 C116 250 112 300 114 360 C116 410 118 450 122 490 C124 505 122 525 125 540 C127 548 132 552 136 550 C140 548 141 540 140 530 C137 490 134 430 132 370 C130 320 132 265 138 238 Z"
                fill="url(#skinGrad)"
              />
              {/* Right Arm */}
              <path
                d="M276 228 C284 250 288 300 286 360 C284 410 282 450 278 490 C276 505 278 525 275 540 C273 548 268 552 264 550 C260 548 259 540 260 530 C263 490 266 430 268 370 C270 320 268 265 262 238 Z"
                fill="url(#skinGrad)"
              />

              {/* Legs (Hips down to ankles) */}
              {/* Left Leg */}
              <path
                d="M165 470 C162 510 160 560 161 615 C162 650 164 690 166 725 L186 725 C186 690 187 650 188 615 C189 560 193 510 196 475 Z"
                fill="url(#skinGrad)"
              />
              {/* Right Leg */}
              <path
                d="M204 475 C207 510 211 560 212 615 C213 650 214 690 214 725 L234 725 C236 690 238 650 239 615 C240 560 238 510 235 470 Z"
                fill="url(#skinGrad)"
              />

              {/* Kneecap Subtle Contours */}
              <ellipse cx="174" cy="595" rx="5" ry="7" fill={skinShadow} opacity="0.18" />
              <ellipse cx="224" cy="595" rx="5" ry="7" fill={skinShadow} opacity="0.18" />
            </g>
          </g>

          {/* =================================================================
              LAYER 4: BASE WEAR (Underlayer shown if no garment selected)
              ================================================================= */}
          {bottomType === "none" && (
            <g
              className="transition-transform duration-200 ease-out"
              style={{
                transform: `translate(${pBottoms.x}px, ${pBottoms.y}px)`,
              }}
            >
              {/* Tailored Minimal Underwear Shorts */}
              <path
                d="M160 440 C170 435 230 435 240 440 L244 505 C230 512 215 512 203 502 C190 512 175 512 156 505 Z"
                fill={baseWearHex}
                opacity="0.9"
              />
            </g>
          )}

          {topType === "none" && (
            <g
              className="transition-transform duration-200 ease-out"
              style={{
                transform: `translate(${pTops.x}px, ${pTops.y}px)`,
              }}
            >
              {/* Minimalist Bandeau / Underlayer */}
              <path
                d="M140 260 C155 255 245 255 260 260 L258 310 C245 315 155 315 142 310 Z"
                fill={baseWearHex}
                opacity="0.9"
              />
            </g>
          )}

          {/* =================================================================
              LAYER 5: LOWER GARMENT (Trousers, Wide Chinos, Shorts)
              ================================================================= */}
          {bottomType !== "none" && (
            <g
              className="transition-transform duration-200 ease-out"
              filter="url(#garmentShadow)"
              style={{
                transform: `translate(${pBottoms.x}px, ${pBottoms.y}px)`,
              }}
            >
              {bottomType === "trousers" && (
                /* Tailored Slim-Straight Trousers with pressed crease */
                <g>
                  {/* Waistband */}
                  <path
                    d="M156 418 C170 414 230 414 244 418 L248 450 C232 454 168 454 152 450 Z"
                    fill="url(#bottomGrad)"
                  />
                  {/* Left Leg */}
                  <path
                    d="M152 445 L158 718 C168 720 188 720 196 718 L198 480 C194 465 190 455 186 448 Z"
                    fill="url(#bottomGrad)"
                  />
                  {/* Right Leg */}
                  <path
                    d="M214 448 C210 455 206 465 202 480 L204 718 C212 720 232 720 242 718 L248 445 Z"
                    fill="url(#bottomGrad)"
                  />
                  {/* Center Creases */}
                  <line
                    x1="177"
                    y1="460"
                    x2="177"
                    y2="714"
                    stroke={bottomShadow}
                    strokeWidth="1.2"
                    opacity="0.5"
                  />
                  <line
                    x1="223"
                    y1="460"
                    x2="223"
                    y2="714"
                    stroke={bottomShadow}
                    strokeWidth="1.2"
                    opacity="0.5"
                  />
                  {/* Ankle Hem Cuff */}
                  <path
                    d="M158 714 Q177 718 196 714 M204 714 Q223 718 242 714"
                    stroke={bottomShadow}
                    strokeWidth="1.5"
                    fill="none"
                  />
                </g>
              )}

              {bottomType === "wide_chinos" && (
                /* Relaxed Wide-Leg Chinos with generous architectural drape */
                <g>
                  {/* Waistband */}
                  <path
                    d="M152 415 C170 410 230 410 248 415 L252 448 C234 452 166 452 148 448 Z"
                    fill="url(#bottomGrad)"
                  />
                  {/* Left Leg (Voluminous) */}
                  <path
                    d="M148 445 L144 722 C164 725 195 725 202 722 L199 485 C196 465 192 455 186 448 Z"
                    fill="url(#bottomGrad)"
                  />
                  {/* Right Leg (Voluminous) */}
                  <path
                    d="M214 448 C208 455 204 465 201 485 L198 722 C205 725 236 725 256 722 L252 445 Z"
                    fill="url(#bottomGrad)"
                  />
                  {/* Drape fold shading */}
                  <path
                    d="M165 470 Q162 600 160 718 M235 470 Q238 600 240 718"
                    stroke={bottomShadow}
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.4"
                  />
                </g>
              )}

              {bottomType === "shorts" && (
                /* Clean Tailored Bermuda Shorts ending just above knees */
                <g>
                  <path
                    d="M154 418 C170 414 230 414 246 418 L254 570 C234 575 212 575 203 555 C194 575 172 575 146 570 Z"
                    fill="url(#bottomGrad)"
                  />
                  {/* Hem lines */}
                  <line
                    x1="148"
                    y1="568"
                    x2="198"
                    y2="568"
                    stroke={bottomShadow}
                    strokeWidth="2"
                    opacity="0.4"
                  />
                  <line
                    x1="208"
                    y1="568"
                    x2="252"
                    y2="568"
                    stroke={bottomShadow}
                    strokeWidth="2"
                    opacity="0.4"
                  />
                </g>
              )}
            </g>
          )}

          {/* =================================================================
              LAYER 6: UPPER GARMENT (Tee, Shirt, Jacket)
              ================================================================= */}
          {topType !== "none" && (
            <g
              className="transition-transform duration-200 ease-out"
              filter="url(#garmentShadow)"
              style={{
                transform: `translate(${pTops.x}px, ${pTops.y}px)`,
              }}
            >
              {topType === "tee" && (
                /* Fitted Modern Crewneck T-Shirt */
                <g>
                  {/* Torso & Sleeves */}
                  <path
                    d="M182 195 Q200 208 218 195 L268 220 L288 288 L262 298 L258 260 L256 425 C235 430 165 430 144 425 L142 260 L138 298 L112 288 L132 220 Z"
                    fill="url(#topGrad)"
                  />
                  {/* Ribbed Collar */}
                  <path
                    d="M182 195 Q200 210 218 195 Q200 216 182 195 Z"
                    fill={topHighlight}
                    stroke={topShadow}
                    strokeWidth="1.2"
                  />
                  {/* Subtle side drape folds */}
                  <path
                    d="M148 370 Q160 380 170 382 M252 370 Q240 380 230 382"
                    stroke={topShadow}
                    strokeWidth="1.2"
                    fill="none"
                    opacity="0.35"
                  />
                </g>
              )}

              {topType === "shirt" && (
                /* Crisp Oxford Button-Down Shirt with Structured Collar */
                <g>
                  {/* Body & Sleeves */}
                  <path
                    d="M182 190 L200 200 L218 190 L270 218 L286 380 L264 384 L260 270 L258 435 C235 442 165 442 142 435 L140 270 L136 384 L114 380 L130 218 Z"
                    fill="url(#topGrad)"
                  />
                  {/* Left Collar Leaf */}
                  <path
                    d="M182 190 L200 220 L195 224 L176 198 Z"
                    fill={topHighlight}
                    stroke={topShadow}
                    strokeWidth="1.2"
                  />
                  {/* Right Collar Leaf */}
                  <path
                    d="M218 190 L200 220 L205 224 L224 198 Z"
                    fill={topHighlight}
                    stroke={topShadow}
                    strokeWidth="1.2"
                  />
                  {/* Button Placket */}
                  <rect
                    x="196"
                    y="220"
                    width="8"
                    height="215"
                    fill={topHighlight}
                    stroke={topShadow}
                    strokeWidth="0.8"
                    opacity="0.9"
                  />
                  {/* Buttons */}
                  {[240, 275, 310, 345, 380, 415].map((by) => (
                    <circle
                      key={by}
                      cx="200"
                      cy={by}
                      r="1.8"
                      fill="#FFFFFF"
                      stroke={topShadow}
                      strokeWidth="0.8"
                    />
                  ))}
                </g>
              )}

              {topType === "jacket" && (
                /* High-End Tailored Structured Blazer / Suit Jacket */
                <g>
                  {/* Inner layer reveal */}
                  <path d="M190 202 L200 320 L210 202 Z" fill="#202024" />

                  {/* Jacket Body & Long Sleeves */}
                  <path
                    d="M180 190 L274 216 L292 410 L268 414 L264 285 L264 455 C235 465 165 465 136 455 L136 285 L132 414 L108 410 L126 216 Z"
                    fill="url(#topGrad)"
                  />
                  {/* Left Notch Lapel */}
                  <path
                    d="M180 190 L166 250 L188 285 L198 340 L190 340 L176 270 L160 252 Z"
                    fill={topHighlight}
                    stroke={topShadow}
                    strokeWidth="1.5"
                  />
                  {/* Right Notch Lapel */}
                  <path
                    d="M220 190 L234 250 L212 285 L202 340 L210 340 L224 270 L240 252 Z"
                    fill={topHighlight}
                    stroke={topShadow}
                    strokeWidth="1.5"
                  />
                  {/* Welt Chest Pocket */}
                  <line
                    x1="222"
                    y1="270"
                    x2="246"
                    y2="270"
                    stroke={topShadow}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Front Closure Button */}
                  <circle
                    cx="200"
                    cy="348"
                    r="3.2"
                    fill="#151515"
                    stroke="#D4AF37"
                    strokeWidth="1"
                  />
                </g>
              )}
            </g>
          )}

          {/* =================================================================
              LAYER 7: FOOTWEAR (Sneakers, Loafers)
              ================================================================= */}
          {shoesType !== "none" && (
            <g
              className="transition-transform duration-200 ease-out"
              filter="url(#garmentShadow)"
              style={{
                transform: `translate(${pBottoms.x}px, ${pBottoms.y}px)`,
              }}
            >
              {shoesType === "sneakers" && (
                /* Minimalist Luxury Low-Top Sneakers */
                <g>
                  {/* Left Sneaker */}
                  <path
                    d="M164 716 C162 725 152 735 142 742 C146 745 186 745 194 742 C196 735 194 725 190 716 Z"
                    fill="url(#shoesGrad)"
                  />
                  {/* White Chunky Outsole */}
                  <path
                    d="M140 740 C146 746 190 746 196 740 L196 746 C190 750 146 750 140 746 Z"
                    fill="#FFFFFF"
                    stroke="#D5D5D5"
                    strokeWidth="0.8"
                  />
                  {/* Right Sneaker */}
                  <path
                    d="M210 716 C206 725 204 735 206 742 C214 745 254 745 258 742 C248 735 238 725 236 716 Z"
                    fill="url(#shoesGrad)"
                  />
                  {/* White Chunky Outsole */}
                  <path
                    d="M204 740 C210 746 254 746 260 740 L260 746 C254 750 210 750 204 746 Z"
                    fill="#FFFFFF"
                    stroke="#D5D5D5"
                    strokeWidth="0.8"
                  />
                </g>
              )}

              {shoesType === "loafers" && (
                /* Sleek Italian Penny Loafers */
                <g>
                  {/* Left Loafer */}
                  <path
                    d="M165 718 C163 726 150 735 144 743 C150 745 188 745 192 743 C194 736 191 726 189 718 Z"
                    fill="url(#shoesGrad)"
                  />
                  <rect x="156" y="730" width="24" height="4" rx="2" fill={shoesHighlight} />
                  {/* Right Loafer */}
                  <path
                    d="M211 718 C209 726 206 736 208 743 C212 745 250 745 256 743 C250 735 237 726 235 718 Z"
                    fill="url(#shoesGrad)"
                  />
                  <rect x="220" y="730" width="24" height="4" rx="2" fill={shoesHighlight} />
                </g>
              )}
            </g>
          )}

          {/* =================================================================
              LAYER 8: FACIAL EXPRESSION & FEATURES
              ================================================================= */}
          {viewAngle !== "back" && (
            <g
              className="transition-transform duration-200 ease-out"
              style={{
                transform: `translate(${pFace.x}px, ${pFace.y}px)`,
              }}
            >
              {/* Eyebrows */}
              {facialExpression === "confident" ? (
                <>
                  <path
                    d="M182 100 Q192 97 197 102"
                    stroke="#2D2826"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M203 103 Q208 96 218 97"
                    stroke="#2D2826"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              ) : facialExpression === "editorial" ? (
                <>
                  <path
                    d="M182 99 L197 101"
                    stroke="#2D2826"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M203 101 L218 99"
                    stroke="#2D2826"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M182 100 Q190 98 197 102"
                    stroke="#2D2826"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M203 102 Q210 98 218 100"
                    stroke="#2D2826"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </>
              )}

              {/* Eyes */}
              <ellipse cx="190" cy="110" rx="3.5" ry="2.2" fill="#201E1D" />
              <circle cx="191" cy="109.2" r="0.8" fill="#FFFFFF" />

              <ellipse cx="210" cy="110" rx="3.5" ry="2.2" fill="#201E1D" />
              <circle cx="211" cy="109.2" r="0.8" fill="#FFFFFF" />

              {/* Nose Bridge Contour */}
              <path
                d="M200 108 L200 124 L197 127"
                stroke={skinShadow}
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.65"
              />

              {/* Lips / Mouth */}
              {facialExpression === "smile" ? (
                <path
                  d="M192 136 Q200 144 208 136"
                  stroke="#964B45"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : facialExpression === "confident" ? (
                <path
                  d="M193 138 Q200 137 208 134"
                  stroke="#964B45"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />
              ) : facialExpression === "editorial" ? (
                <g>
                  <path
                    d="M194 135 Q200 133 206 135"
                    stroke="#964B45"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M194 138 Q200 140 206 138"
                    stroke="#7D3B36"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              ) : (
                /* Neutral straight high-fashion lip */
                <path
                  d="M193 137 L207 137"
                  stroke="#964B45"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              )}
            </g>
          )}

          {/* =================================================================
              LAYER 9: EYEWEAR
              ================================================================= */}
          {viewAngle !== "back" && eyewear !== "none" && (
            <g
              className="transition-transform duration-150 ease-out"
              filter="url(#eyewearShadow)"
              style={{
                transform: `translate(${pEyewear.x}px, ${pEyewear.y}px)`,
              }}
            >
              {/* Bridge */}
              <line
                x1="196"
                y1="109"
                x2="204"
                y2="109"
                stroke="#1A1A1A"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {/* Left Lens Frame */}
              <circle
                cx="189"
                cy="110"
                r="9.5"
                fill="rgba(255, 255, 255, 0.22)"
                stroke="#1A1A1A"
                strokeWidth="2.2"
              />
              {/* Left Lens Glare */}
              <path
                d="M184 104 L187 104"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />

              {/* Right Lens Frame */}
              <circle
                cx="211"
                cy="110"
                r="9.5"
                fill="rgba(255, 255, 255, 0.22)"
                stroke="#1A1A1A"
                strokeWidth="2.2"
              />
              {/* Right Lens Glare */}
              <path
                d="M206 104 L209 104"
                stroke="rgba(255, 255, 255, 0.85)"
                strokeWidth="1.6"
                strokeLinecap="round"
              />

              {/* Temples into hairline */}
              <line x1="179.5" y1="109" x2="167" y2="108" stroke="#1A1A1A" strokeWidth="2" />
              <line x1="220.5" y1="109" x2="233" y2="108" stroke="#1A1A1A" strokeWidth="2" />
            </g>
          )}

          {/* =================================================================
              LAYER 10: FRONT HAIR (All distinct hair styles)
              ================================================================= */}
          {hairStyle !== "none" && (
            <g
              className="transition-transform duration-200 ease-out"
              filter="url(#garmentShadow)"
              style={{
                transform: `translate(${pHairFront.x}px, ${pHairFront.y}px)`,
              }}
            >
              {hairStyle === "buzz_cut" && (
                /* Crisp Clean Fade & Buzz Cut */
                <path
                  d="M166 115 C164 80 180 70 200 70 C220 70 236 80 234 115 C230 95 220 85 200 85 C180 85 170 95 166 115 Z"
                  fill="url(#hairGrad)"
                  strokeWidth="2"
                />
              )}

              {hairStyle === "wavy_curtains" && (
                /* Middle Part Curtain Flow */
                <g>
                  {/* Left Curtain */}
                  <path
                    d="M198 80 C180 75 162 90 160 120 C162 135 170 140 174 135 C176 120 184 100 198 94 Z"
                    fill="url(#hairGrad)"
                  />
                  {/* Right Curtain */}
                  <path
                    d="M202 80 C220 75 238 90 240 120 C238 135 230 140 226 135 C224 120 216 100 202 94 Z"
                    fill="url(#hairGrad)"
                  />
                  {/* Crown */}
                  <path
                    d="M165 110 C165 72 180 66 200 66 C220 66 235 72 235 110 C228 80 215 74 200 74 C185 74 172 80 165 110 Z"
                    fill="url(#hairGrad)"
                  />
                </g>
              )}

              {hairStyle === "short_textured" && (
                /* Textured Modern Crop with Micro-Fringe */
                <path
                  d="M164 115 C162 76 178 68 200 68 C222 68 238 76 236 115 C232 94 228 92 222 98 C216 90 210 96 204 90 C198 96 192 90 186 98 C180 92 172 96 168 112 Z"
                  fill="url(#hairGrad)"
                />
              )}

              {hairStyle === "curly_high_top" && (
                /* Volumetric Curly Afro / High Top */
                <path
                  d="M160 115 C156 60 172 50 200 50 C228 50 244 60 240 115 C234 85 220 75 200 75 C180 75 166 85 160 115 Z"
                  fill="url(#hairGrad)"
                />
              )}

              {hairStyle === "center_part_bob" && (
                /* Sleek Chin-Length Straight Bob */
                <g>
                  <path
                    d="M165 110 C162 75 178 68 200 68 C222 68 238 75 235 110 L242 185 C236 190 228 170 228 150 C226 120 218 95 202 92 L198 92 C182 95 174 120 172 150 C172 170 164 190 158 185 Z"
                    fill="url(#hairGrad)"
                  />
                </g>
              )}

              {hairStyle === "long_waves" && (
                /* Flowing Waves draping over front shoulders */
                <g>
                  {/* Crown */}
                  <path
                    d="M164 115 C160 74 176 68 200 68 C224 68 240 74 236 115 C228 85 216 78 200 78 C184 78 172 85 164 115 Z"
                    fill="url(#hairGrad)"
                  />
                  {/* Left Front Wave Strand */}
                  <path
                    d="M166 110 C160 145 152 195 156 240 C160 265 168 275 172 265 C168 240 170 185 176 135 Z"
                    fill="url(#hairGrad)"
                  />
                  {/* Right Front Wave Strand */}
                  <path
                    d="M234 110 C240 145 248 195 244 240 C240 265 232 275 228 265 C232 240 230 185 224 135 Z"
                    fill="url(#hairGrad)"
                  />
                </g>
              )}
            </g>
          )}

          {/* =================================================================
              LAYER 11: STUDIO RIM LIGHT & GLASS SHEEN OVERLAY
              ================================================================= */}
          <g
            className="pointer-events-none transition-transform duration-100 ease-out"
            style={{
              transform: `translate(${tilt.x * 14}px, ${tilt.y * 7}px)`,
            }}
          >
            {/* Subtle atmospheric vignette / gloss accent */}
            <ellipse
              cx="200"
              cy="280"
              rx="150"
              ry="240"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1.5"
            />
          </g>
        </svg>
      </div>

      {/* Interactive Drag / Tilt Prompt for first-time discovery */}
      <div
        className={cn(
          "absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/70 px-3 py-1 text-[11px] font-medium text-neutral-500 shadow-xs backdrop-blur-md transition-opacity pointer-events-none",
          isHovered ? "opacity-30" : "opacity-90",
        )}
      >
        <Compass className="h-3 w-3 text-neutral-400 animate-spin-slow" />
        <span>Move pointer or tilt phone for 2.5D depth</span>
      </div>
    </div>
  );
}
