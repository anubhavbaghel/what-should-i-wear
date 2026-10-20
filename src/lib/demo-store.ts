import type { Database, Json } from "@/integrations/supabase/types";

export type MannequinPresetId = Database["public"]["Enums"]["mannequin_preset"];
export type DemoClothingItem = Database["public"]["Tables"]["clothing_items"]["Row"];
export type DemoOutfit = Database["public"]["Tables"]["outfits"]["Row"];

const INITIAL_DEMO_ITEMS: DemoClothingItem[] = [
  {
    id: "demo-item-1",
    user_id: "demo-user-id",
    name: "Cream Oversized Linen Shirt",
    category: "top",
    color: "Cream",
    image_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:01:00.000Z",
    ai_tags: {},
  },
  {
    id: "demo-item-2",
    user_id: "demo-user-id",
    name: "Pleated Wide-Leg Chinos",
    category: "bottom",
    color: "Olive / Sage",
    image_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:02:00.000Z",
    ai_tags: {},
  },
  {
    id: "demo-item-3",
    user_id: "demo-user-id",
    name: "Minimalist Chunky White Sneakers",
    category: "shoes",
    color: "White",
    image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:03:00.000Z",
    ai_tags: {},
  },
  {
    id: "demo-item-4",
    user_id: "demo-user-id",
    name: "Structured Camel Trench Coat",
    category: "outerwear",
    color: "Camel",
    image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:04:00.000Z",
    ai_tags: {},
  },
  {
    id: "demo-item-5",
    user_id: "demo-user-id",
    name: "Vintage Boxy Cotton Tee",
    category: "top",
    color: "Washed Black",
    image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:05:00.000Z",
    ai_tags: {},
  },
  {
    id: "demo-item-6",
    user_id: "demo-user-id",
    name: "Straight-Leg Selvedge Denim",
    category: "bottom",
    color: "Indigo Blue",
    image_url: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:06:00.000Z",
    ai_tags: {},
  },
  {
    id: "demo-item-7",
    user_id: "demo-user-id",
    name: "Minimalist Tailored Jumpsuit / Set",
    category: "dress",
    color: "Sandstone",
    image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:07:00.000Z",
    ai_tags: {},
  },
  {
    id: "demo-item-8",
    user_id: "demo-user-id",
    name: "Brushed Steel Minimalist Watch",
    category: "accessory",
    color: "Silver",
    image_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:08:00.000Z",
    ai_tags: {},
  },
  {
    id: "demo-item-9",
    user_id: "demo-user-id",
    name: "Classic Polished Black Loafers",
    category: "shoes",
    color: "Black",
    image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop",
    cutout_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:09:00.000Z",
    ai_tags: {},
  },
];

const INITIAL_DEMO_OUTFITS: DemoOutfit[] = [
  {
    id: "demo-outfit-1",
    user_id: "demo-user-id",
    name: "Effortless City Tailoring",
    item_ids: ["demo-item-1", "demo-item-2", "demo-item-3", "demo-item-8"],
    mannequin_preset: "neutral_medium",
    generated_image_url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:10:00.000Z",
  },
  {
    id: "demo-outfit-2",
    user_id: "demo-user-id",
    name: "Weekend Trench & Denim",
    item_ids: ["demo-item-4", "demo-item-5", "demo-item-6", "demo-item-9"],
    mannequin_preset: "slim_medium",
    generated_image_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop",
    created_at: "2026-10-18T00:11:00.000Z",
  },
];

let demoItems: DemoClothingItem[] = [];
let demoOutfits: DemoOutfit[] = [];
let demoProfile = {
  id: "demo-user-id",
  display_name: "",
  mannequin_preset: "neutral_medium",
  onboarded_at: null as string | null,
  style_presentation: "neutral" as "neutral" | "masculine" | "feminine",
  avatar_config: {
    build: "neutral" as "slim" | "neutral" | "curvy",
    skinToneHex: "#D59D7B",
    presentation: "neutral" as "neutral" | "masculine" | "feminine",
    baseWearHex: "#232326",
    heightScale: 1.0,
  },
};

export const demoStore = {
  isDemoUser(userId: string) {
    return userId === "demo-user-id";
  },

  getItems(): DemoClothingItem[] {
    return [...demoItems];
  },

  getItem(id: string): DemoClothingItem | undefined {
    return demoItems.find((it) => it.id === id);
  },

  addItem(item: Omit<DemoClothingItem, "id" | "user_id" | "created_at">): DemoClothingItem {
    const newItem: DemoClothingItem = {
      ...item,
      id: `demo-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: "demo-user-id",
      created_at: new Date().toISOString(),
    };
    demoItems.unshift(newItem);
    return newItem;
  },

  addBatchItems(items: Array<Omit<DemoClothingItem, "id" | "user_id" | "created_at">>): DemoClothingItem[] {
    const newItems: DemoClothingItem[] = items.map((it, idx) => ({
      ...it,
      id: `demo-item-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: "demo-user-id",
      created_at: new Date(Date.now() - idx * 1000).toISOString(),
    }));
    demoItems = [...newItems, ...demoItems];
    return newItems;
  },

  updateItem(id: string, patch: Partial<DemoClothingItem>): DemoClothingItem | undefined {
    const idx = demoItems.findIndex((it) => it.id === id);
    if (idx === -1) return undefined;
    demoItems[idx] = { ...demoItems[idx], ...patch };
    return demoItems[idx];
  },

  deleteItem(id: string): boolean {
    const before = demoItems.length;
    demoItems = demoItems.filter((it) => it.id !== id);
    return demoItems.length < before;
  },

  getOutfits(): DemoOutfit[] {
    return [...demoOutfits];
  },

  getOutfit(id: string): { outfit: DemoOutfit; items: DemoClothingItem[] } | undefined {
    const outfit = demoOutfits.find((o) => o.id === id);
    if (!outfit) return undefined;
    const items = demoItems.filter((it) => outfit.item_ids.includes(it.id));
    return { outfit, items };
  },

  addOutfit(data: { name: string; item_ids: string[]; mannequin_preset: MannequinPresetId }): DemoOutfit {
    // Generate an aesthetic look image URL based on mannequin preset & presentation
    const sampleEditorialImages = [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop",
    ];
    const generated_image_url =
      sampleEditorialImages[Math.floor(Math.random() * sampleEditorialImages.length)];

    const newOutfit: DemoOutfit = {
      id: `demo-outfit-${Date.now()}`,
      user_id: "demo-user-id",
      name: data.name || "Curated Look",
      item_ids: data.item_ids,
      mannequin_preset: data.mannequin_preset,
      generated_image_url,
      created_at: new Date().toISOString(),
    };
    demoOutfits.unshift(newOutfit);
    return newOutfit;
  },

  deleteOutfit(id: string): boolean {
    const before = demoOutfits.length;
    demoOutfits = demoOutfits.filter((o) => o.id !== id);
    return demoOutfits.length < before;
  },

  renameOutfit(id: string, name: string): boolean {
    const outfit = demoOutfits.find((o) => o.id === id);
    if (!outfit) return false;
    outfit.name = name;
    return true;
  },

  getProfile() {
    return { ...demoProfile };
  },

  updatePreset(preset: string) {
    demoProfile.mannequin_preset = preset;
  },

  updatePresentation(presentation: "neutral" | "masculine" | "feminine") {
    demoProfile.style_presentation = presentation;
  },

  updateAvatarConfig(config: {
    build?: "slim" | "neutral" | "curvy";
    skinToneHex?: string;
    presentation?: "neutral" | "masculine" | "feminine";
    baseWearHex?: string;
    heightScale?: number;
  }) {
    demoProfile.avatar_config = {
      ...demoProfile.avatar_config,
      ...config,
    };
  },

  completeOnboarding(data: {
    displayName?: string;
    preset: string;
    stylePresentation?: "neutral" | "masculine" | "feminine";
    avatarConfig?: {
      build?: "slim" | "neutral" | "curvy";
      skinToneHex?: string;
      presentation?: "neutral" | "masculine" | "feminine";
      baseWearHex?: string;
      heightScale?: number;
    };
  }) {
    demoProfile.onboarded_at = new Date().toISOString();
    if (data.displayName) demoProfile.display_name = data.displayName;
    demoProfile.mannequin_preset = data.preset;
    if (data.stylePresentation) demoProfile.style_presentation = data.stylePresentation;
    if (data.avatarConfig) {
      demoProfile.avatar_config = {
        ...demoProfile.avatar_config,
        ...data.avatarConfig,
      };
    }
  },

  resetAsFirstTime() {
    demoItems = [];
    demoOutfits = [];
    demoProfile = {
      id: "demo-user-id",
      display_name: "",
      mannequin_preset: "neutral_medium",
      onboarded_at: null,
      style_presentation: "neutral",
      avatar_config: {
        build: "neutral",
        skinToneHex: "#D59D7B",
        presentation: "neutral",
        baseWearHex: "#232326",
        heightScale: 1.0,
      },
    };
  },

  loadSampleWardrobe() {
    demoItems = [...INITIAL_DEMO_ITEMS];
    demoOutfits = [...INITIAL_DEMO_OUTFITS];
  },

  reset() {
    this.resetAsFirstTime();
  },
};
