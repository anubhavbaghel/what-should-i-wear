import { supabase, isSupabaseConfigured } from "./client";
import { Outfit } from "@/domain/outfit";

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
    outfitData: Omit<Outfit, "id" | "user_id" | "created_at" | "is_favorite">
  ): Promise<Outfit> {
    if (!isSupabaseConfigured) {
      const newOutfit: Outfit = {
        id: `outfit-${Date.now()}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        is_favorite: false,
        ...outfitData,
      };
      localOutfitsStore.unshift(newOutfit);
      return newOutfit;
    }

    const { data, error } = await supabase
      .from("outfits")
      .insert({
        user_id: userId,
        title: outfitData.title,
        description: outfitData.description,
        occasion: outfitData.occasion,
        weather_summary: outfitData.weather_summary,
        item_ids: outfitData.item_ids,
        ai_reasoning: outfitData.ai_reasoning,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save outfit: ${error.message}`);
    return data;
  }

  async toggleFavorite(userId: string, outfitId: string, currentStatus: boolean): Promise<void> {
    if (!isSupabaseConfigured) {
      localOutfitsStore = localOutfitsStore.map((o) =>
        o.id === outfitId ? { ...o, is_favorite: !currentStatus } : o
      );
      return;
    }

    const { error } = await supabase
      .from("outfits")
      .update({ is_favorite: !currentStatus })
      .eq("id", outfitId)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to toggle favorite: ${error.message}`);
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
