import { z } from "zod";

export interface UserProfile {
  id: string;
  created_at: string;
  updated_at: string;
  display_name?: string | null;
  style_vibe?: string | null;
  preferred_colors?: string[];
  location?: string | null;
  onboarding_completed: boolean;
}

export const OnboardingFormSchema = z.object({
  display_name: z.string().min(2, "Name must be at least 2 characters"),
  style_vibe: z.string().min(1, "Select a style vibe"),
  preferred_colors: z.array(z.string()).min(1, "Select at least one color"),
  location: z.string().optional(),
});

export type OnboardingFormData = z.infer<typeof OnboardingFormSchema>;
