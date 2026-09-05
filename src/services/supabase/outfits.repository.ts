import { supabase, isSupabaseConfigured } from "./client";
import { Outfit } from "@/domain/outfit";
import type { MannequinPreset } from "@/domain/user";

let localOutfitsStore: Outfit[] = [];

export class OutfitsRepository {
  async getOutfits(userId: string): Promise<Outfit[]> {
    if (!isSupabaseConfigured) {
      return [...localOutfitsStore];
    }

    const { data, error } = await supabase
      .from("outfits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch outfits: ${error.message}`);
    return data ?? [];
  }

  async saveOutfit(
    userId: string,
    outfitData: {
      name?: string;
      item_ids: string[];
      mannequin_preset?: MannequinPreset;
      generated_image_url?: string | null;
    }
  ): Promise<Outfit> {
    if (!isSupabaseConfigured) {
      const newOutfit: Outfit = {
        id: `outfit-${Date.now()}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        name: outfitData.name ?? "New look",
        mannequin_preset: outfitData.mannequin_preset ?? "neutral_medium",
        item_ids: outfitData.item_ids,
        generated_image_url: outfitData.generated_image_url,
      };
      localOutfitsStore.unshift(newOutfit);
      return newOutfit;
    }

    const { data, error } = await supabase
      .from("outfits")
      .insert({
        user_id: userId,
        name: outfitData.name ?? "New look",
        mannequin_preset: outfitData.mannequin_preset ?? "neutral_medium",
        item_ids: outfitData.item_ids,
        generated_image_url: outfitData.generated_image_url ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save outfit: ${error.message}`);
    return data;
  }

  async deleteOutfit(userId: string, outfitId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      localOutfitsStore = localOutfitsStore.filter((o) => o.id !== outfitId);
      return;
    }

    const { error } = await supabase
      .from("outfits")
      .delete()
      .eq("id", outfitId)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete outfit: ${error.message}`);
  }
}

export const outfitsRepository = new OutfitsRepository();
