import { supabase, isSupabaseConfigured } from "./client";
import type { UserProfile, MannequinPreset } from "@/domain/user";

let localProfile: UserProfile | null = null;

export class ProfileRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured) {
      return localProfile;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
    return data;
  }

  async completeOnboarding(
    userId: string,
    data: { display_name?: string; preset: MannequinPreset }
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      localProfile = {
        id: userId,
        display_name: data.display_name,
        mannequin_preset: data.preset,
        onboarded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        mannequin_preset: data.preset,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw new Error(`Failed to complete onboarding: ${error.message}`);
  }

  async updateMannequinPreset(userId: string, preset: MannequinPreset): Promise<void> {
    if (!isSupabaseConfigured) {
      if (localProfile) localProfile.mannequin_preset = preset;
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ mannequin_preset: preset })
      .eq("id", userId);

    if (error) throw new Error(`Failed to update mannequin preset: ${error.message}`);
  }
}

export const profileRepository = new ProfileRepository();
