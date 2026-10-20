import React from "react";
import { cn } from "@/lib/utils";

export type BuildType = "slim" | "neutral" | "curvy";
export type SkinToneType = "light" | "medium" | "dark";
export type StylePresentationType = "neutral" | "masculine" | "feminine";

export interface MannequinAvatarProps {
  build?: BuildType;
  skinTone?: SkinToneType;
  presentation?: StylePresentationType;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | number;
  showBaseWear?: boolean;
  /** Optional clothing cutout overlays for future try-on layers */
  clothingLayers?: {
    topUrl?: string | null;
    bottomUrl?: string | null;
    outerwearUrl?: string | null;
    shoesUrl?: string | null;
  };
}

const SKIN_PALETTES: Record<SkinToneType, { fill: string; stroke: string; shadow: string }> = {
  light: {
    fill: "#FCE5D8",
    stroke: "#E0BBA6",
    shadow: "#D1A38D",
  },
  medium: {
    fill: "#D59D7B",
    stroke: "#B87F5C",
    shadow: "#9D6745",
  },
  dark: {
    fill: "#6D4835",
    stroke: "#533322",
    shadow: "#412415",
  },
};

/**
 * Parametric SVG Fashion Mannequin
 * Renders an optimized, scalable editorial mannequin figure supporting:
 * - 3 body builds (Slim, Athletic/Balanced, Broad/Curvy)
 * - 3 authentic skin tones (Light, Medium, Deep)
 * - 3 style presentation vibes (Unisex/Neutral, Menswear, Womenswear)
 * - Zero network overhead (Pure SVG, < 4KB)
 */
export function MannequinAvatar({
  build = "neutral",
  skinTone = "medium",
  presentation = "neutral",
  className,
  size = "md",
  showBaseWear = true,
  clothingLayers,
}: MannequinAvatarProps) {
  const palette = SKIN_PALETTES[skinTone] || SKIN_PALETTES.medium;

  const sizeClasses = {
    sm: "w-16 h-28",
    md: "w-24 h-40",
    lg: "w-36 h-60",
    xl: "w-48 h-80",
  };

  const isNumeric = typeof size === "number";

  // Build-specific path landmarks (viewBox 0 0 100 200)
  // Head: center at (50, 22), rX: 8, rY: 10
  // Neck: (47, 32) to (53, 32)
  // Shoulders, Torso, Hips, Legs adjust based on build & presentation:

  let shoulderWidth = 26; // Half-width from center 50
  let chestWidth = 18;
  let waistWidth = 14;
  let hipWidth = 18;
  let thighWidth = 8;
  let calfWidth = 6;

  if (build === "slim") {
    shoulderWidth = presentation === "masculine" ? 24 : 20;
    chestWidth = 15;
    waistWidth = 12;
    hipWidth = presentation === "feminine" ? 17 : 15;
    thighWidth = 6.5;
    calfWidth = 5;
  } else if (build === "neutral") {
    // Athletic / Balanced
    shoulderWidth = presentation === "masculine" ? 28 : 23;
    chestWidth = 18;
    waistWidth = 14;
    hipWidth = presentation === "feminine" ? 20 : 18;
    thighWidth = 8;
    calfWidth = 6;
  } else if (build === "curvy") {
    // Broad / Curvy
    shoulderWidth = presentation === "masculine" ? 31 : 25;
    chestWidth = 22;
    waistWidth = 18;
    hipWidth = presentation === "feminine" ? 25 : 22;
    thighWidth = 10;
    calfWidth = 7.5;
  }

  const leftShoulderX = 50 - shoulderWidth;
  const rightShoulderX = 50 + shoulderWidth;
  const leftChestX = 50 - chestWidth;
  const rightChestX = 50 + chestWidth;
  const leftWaistX = 50 - waistWidth;
  const rightWaistX = 50 + waistWidth;
  const leftHipX = 50 - hipWidth;
  const rightHipX = 50 + hipWidth;

  const leftThighX = 50 - thighWidth - 3;
  const rightThighX = 50 + thighWidth + 3;

  return (
    <div
      className={cn("relative flex items-center justify-center select-none", !isNumeric && sizeClasses[size], className)}
      style={isNumeric ? { width: size, height: size * 1.6 } : undefined}
    >
      <svg
        viewBox="0 0 100 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id={`grad-${skinTone}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.fill} />
            <stop offset="100%" stopColor={palette.shadow} />
          </linearGradient>
          <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Head & Neck */}
        <path
          d="M47 32 H53 V40 H47 Z"
          fill={palette.shadow}
        />
        {/* Head silhouette */}
        <ellipse
          cx="50"
          cy="22"
          rx="7.5"
          ry="9.5"
          fill={`url(#grad-${skinTone})`}
          stroke={palette.stroke}
          strokeWidth="1"
        />

        {/* Torso & Core */}
        <path
          d={`
            M 46 38
            C 44 38, ${leftShoulderX + 4} 42, ${leftShoulderX} 45
            C ${leftShoulderX - 1} 46, ${leftChestX} 58, ${leftWaistX} 72
            C ${leftWaistX - 1} 78, ${leftHipX} 86, ${leftHipX} 98
            L ${rightHipX} 98
            C ${rightHipX} 86, ${rightWaistX + 1} 78, ${rightWaistX} 72
            C ${rightChestX} 58, ${rightShoulderX + 1} 46, ${rightShoulderX} 45
            C ${rightShoulderX - 4} 42, 56 38, 54 38
            Z
          `}
          fill={`url(#grad-${skinTone})`}
          stroke={palette.stroke}
          strokeWidth="1"
        />

        {/* Arms */}
        {/* Left Arm */}
        <path
          d={`
            M ${leftShoulderX} 45
            C ${leftShoulderX - 3} 58, ${leftShoulderX - 4} 75, ${leftWaistX - 4} 95
            C ${leftWaistX - 2} 96, ${leftWaistX - 1} 94, ${leftWaistX - 2} 90
            C ${leftShoulderX - 1} 72, ${leftShoulderX} 58, ${leftShoulderX + 2} 48
            Z
          `}
          fill={`url(#grad-${skinTone})`}
          stroke={palette.stroke}
          strokeWidth="0.8"
        />
        {/* Right Arm */}
        <path
          d={`
            M ${rightShoulderX} 45
            C ${rightShoulderX + 3} 58, ${rightShoulderX + 4} 75, ${rightWaistX + 4} 95
            C ${rightWaistX + 2} 96, ${rightWaistX + 1} 94, ${rightWaistX + 2} 90
            C ${rightShoulderX + 1} 72, ${rightShoulderX} 58, ${rightShoulderX - 2} 48
            Z
          `}
          fill={`url(#grad-${skinTone})`}
          stroke={palette.stroke}
          strokeWidth="0.8"
        />

        {/* Left Leg */}
        <path
          d={`
            M ${50 - hipWidth + 1} 98
            C ${leftThighX - 1} 118, ${leftThighX} 138, ${50 - calfWidth - 4} 158
            C ${50 - calfWidth - 3} 175, ${50 - calfWidth - 2} 188, ${44} 195
            L ${48} 195
            C ${50 - 2} 188, ${50 - 2} 175, ${50 - 3} 158
            C ${50 - 2} 138, ${50 - 2} 118, 49 98
            Z
          `}
          fill={`url(#grad-${skinTone})`}
          stroke={palette.stroke}
          strokeWidth="1"
        />

        {/* Right Leg */}
        <path
          d={`
            M ${50 + hipWidth - 1} 98
            C ${rightThighX + 1} 118, ${rightThighX} 138, ${50 + calfWidth + 4} 158
            C ${50 + calfWidth + 3} 175, ${50 + calfWidth + 2} 188, ${56} 195
            L ${52} 195
            C ${50 + 2} 188, ${50 + 2} 175, ${50 + 3} 158
            C ${50 + 2} 138, ${50 + 2} 118, 51 98
            Z
          `}
          fill={`url(#grad-${skinTone})`}
          stroke={palette.stroke}
          strokeWidth="1"
        />

        {/* Base Layer Minimal Bodysuit / Undergarment */}
        {showBaseWear && (
          <g opacity="0.85">
            {/* Top base */}
            <path
              d={`
                M ${50 - chestWidth + 2} 50
                C ${50 - chestWidth + 1} 58, ${leftWaistX + 1} 66, ${leftWaistX + 1} 68
                L ${rightWaistX - 1} 68
                C ${rightWaistX - 1} 66, ${50 + chestWidth - 1} 58, ${50 + chestWidth - 2} 50
                C ${50 + 6} 52, ${50 - 6} 52, ${50 - chestWidth + 2} 50
                Z
              `}
              fill="#242426"
            />
            {/* Bottom base / shorts */}
            <path
              d={`
                M ${leftWaistX + 1} 74
                C ${leftHipX + 1} 84, ${leftHipX + 1} 96, ${50 - thighWidth} 104
                L ${48} 102
                L ${52} 102
                L ${50 + thighWidth} 104
                C ${rightHipX - 1} 96, ${rightHipX - 1} 84, ${rightWaistX - 1} 74
                Z
              `}
              fill="#242426"
            />
          </g>
        )}
      </svg>

      {/* Dynamic 2D Clothing Overlays (Slots for Future Try-On) */}
      {clothingLayers?.bottomUrl && (
        <div
          className="absolute pointer-events-none transition-transform"
          style={{
            top: "38%",
            left: "22%",
            width: "56%",
            height: "46%",
          }}
        >
          <img
            src={clothingLayers.bottomUrl}
            alt="Bottom garment"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
      )}

      {clothingLayers?.topUrl && (
        <div
          className="absolute pointer-events-none transition-transform"
          style={{
            top: "20%",
            left: "16%",
            width: "68%",
            height: "38%",
          }}
        >
          <img
            src={clothingLayers.topUrl}
            alt="Top garment"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
      )}

      {clothingLayers?.outerwearUrl && (
        <div
          className="absolute pointer-events-none transition-transform"
          style={{
            top: "18%",
            left: "12%",
            width: "76%",
            height: "46%",
          }}
        >
          <img
            src={clothingLayers.outerwearUrl}
            alt="Outerwear"
            className="w-full h-full object-contain filter drop-shadow-lg"
          />
        </div>
      )}

      {clothingLayers?.shoesUrl && (
        <div
          className="absolute pointer-events-none transition-transform"
          style={{
            top: "84%",
            left: "30%",
            width: "40%",
            height: "16%",
          }}
        >
          <img
            src={clothingLayers.shoesUrl}
            alt="Shoes"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>
      )}
    </div>
  );
}
