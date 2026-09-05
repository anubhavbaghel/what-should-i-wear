import { z } from "zod";

export const MANNEQUIN_PRESETS = [
  "neutral_light",
  "neutral_medium",
  "neutral_dark",
  "curvy_light",
  "curvy_medium",
  "curvy_dark",
  "slim_light",
  "slim_medium",
  "slim_dark",
] as const;

export type MannequinPreset = (typeof MANNEQUIN_PRESETS)[number];

export const MannequinPresetSchema = z.enum(MANNEQUIN_PRESETS);

export interface UserProfile {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  mannequin_preset: MannequinPreset;
  onboarded_at?: string | null;
  created_at: string;
  updated_at: string;
}

export function describePreset(p: MannequinPreset): string {
  const [build, skin] = p.split("_") as [string, string];
  const buildMap: Record<string, string> = {
    slim: "slim",
    neutral: "average build",
    curvy: "curvy",
  };
  const skinMap: Record<string, string> = {
    light: "light skin tone",
    medium: "medium skin tone",
    dark: "deep skin tone",
  };
  return `${buildMap[build] ?? build}, ${skinMap[skin] ?? skin}`;
}
