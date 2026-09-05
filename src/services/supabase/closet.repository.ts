import { supabase, isSupabaseConfigured } from "./client";
import { Garment, CreateGarmentInput, UpdateGarmentInput } from "@/domain/garment";

// Demo initial items if no Supabase backend is configured
const INITIAL_DEMO_GARMENTS: Garment[] = [
  {
    id: "demo-1",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    name: "Oversized Cream Linen Shirt",
    category: "top",
    color: "Cream",
    image_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop",
  },
  {
    id: "demo-2",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    name: "High-Waist Pleated Trousers",
    category: "bottom",
    color: "Sage Green",
    image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop",
  },
  {
    id: "demo-3",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    name: "Minimalist Leather Loafers",
    category: "shoes",
    color: "Black",
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop",
  },
  {
    id: "demo-4",
    user_id: "demo-user",
    created_at: new Date().toISOString(),
    name: "Structured Camel Trench Coat",
    category: "outerwear",
    color: "Camel",
    image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop",
  },
];

let localGarmentsStore: Garment[] = [...INITIAL_DEMO_GARMENTS];

export class ClosetRepository {
  async getGarments(userId: string): Promise<Garment[]> {
    if (!isSupabaseConfigured) {
      return [...localGarmentsStore];
    }

    const { data, error } = await supabase
      .from("clothing_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch garments: ${error.message}`);
    return data ?? [];
  }

  async getGarmentById(userId: string, id: string): Promise<Garment | null> {
    if (!isSupabaseConfigured) {
      return localGarmentsStore.find((g) => g.id === id) || null;
    }

    const { data, error } = await supabase
      .from("clothing_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch garment: ${error.message}`);
    return data;
  }

  async createGarment(userId: string, input: CreateGarmentInput): Promise<Garment> {
    if (!isSupabaseConfigured) {
      const newGarment: Garment = {
        id: `garment-${Date.now()}`,
        user_id: userId,
        created_at: new Date().toISOString(),
        name: input.name,
        category: input.category,
        color: input.color,
        image_url: input.image_url,
        cutout_url: input.cutout_url,
      };
      localGarmentsStore.unshift(newGarment);
      return newGarment;
    }

    const { data, error } = await supabase
      .from("clothing_items")
      .insert({
        user_id: userId,
        name: input.name,
        category: input.category,
        color: input.color,
        image_url: input.image_url,
        cutout_url: input.cutout_url,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save garment: ${error.message}`);
    return data;
  }

  async updateGarment(userId: string, input: UpdateGarmentInput): Promise<void> {
    if (!isSupabaseConfigured) {
      localGarmentsStore = localGarmentsStore.map((item) =>
        item.id === input.id ? { ...item, ...input } : item
      );
      return;
    }

    const { id, ...patch } = input;
    const { error } = await supabase
      .from("clothing_items")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to update garment: ${error.message}`);
  }

  async deleteGarment(userId: string, id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      localGarmentsStore = localGarmentsStore.filter((g) => g.id !== id);
      return;
    }

    const { error } = await supabase
      .from("clothing_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new Error(`Failed to delete garment: ${error.message}`);
  }
}

export const closetRepository = new ClosetRepository();
