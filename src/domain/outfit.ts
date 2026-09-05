import { z } from "zod";
import { Garment } from "./garment";

export interface Outfit {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  description?: string;
  occasion?: string;
  weather_summary?: string;
  item_ids: string[];
  items?: Garment[];
  is_favorite: boolean;
  ai_reasoning?: string;
}

export const GenerateOutfitParamsSchema = z.object({
  occasion: z.string().default("Casual Daily"),
  weather: z.string().default("Warm & Sunny"),
  styleVibe: z.string().default("Chic & Effortless"),
  targetItemIds: z.array(z.string()).optional(),
});

export type GenerateOutfitParams = z.infer<typeof GenerateOutfitParamsSchema>;

export interface GeneratedOutfitRecommendation {
  title: string;
  description: string;
  occasion: string;
  weather_summary: string;
  selected_item_ids: string[];
  ai_reasoning: string;
  styling_tips: string[];
}
