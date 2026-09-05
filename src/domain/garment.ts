import { z } from "zod";

export const GARMENT_CATEGORIES = [
  "top",
  "bottom",
  "outerwear",
  "dress",
  "shoes",
  "accessory",
] as const;

export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];

export const GarmentCategorySchema = z.enum(GARMENT_CATEGORIES);

export interface Garment {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  name: string;
  category: GarmentCategory;
  color: string;
  image_url: string;
  cutout_url?: string | null;
  ai_tags?: Record<string, unknown>;
}

export const CreateGarmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  category: GarmentCategorySchema,
  color: z.string().min(1, "Color is required").max(40),
  image_url: z.string().url("Invalid image URL"),
  cutout_url: z.string().url().nullable().optional(),
});

export type CreateGarmentInput = z.infer<typeof CreateGarmentSchema>;

export const UpdateGarmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  category: GarmentCategorySchema.optional(),
  color: z.string().min(1).max(40).optional(),
});

export type UpdateGarmentInput = z.infer<typeof UpdateGarmentSchema>;
