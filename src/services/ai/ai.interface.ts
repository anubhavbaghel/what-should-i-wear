import { Garment, GarmentCategory } from "@/domain/garment";
import { GenerateOutfitParams, GeneratedOutfitRecommendation } from "@/domain/outfit";

export interface GarmentAnalysisResult {
  category: GarmentCategory;
  name: string;
  color: string;
}

export interface BackgroundRemovalResult {
  cutoutDataUrl: string | null;
}

export interface AIService {
  categorizeGarment(imageUrl: string): Promise<GarmentAnalysisResult>;
  removeBackground(imageUrl: string): Promise<BackgroundRemovalResult>;
  generateOutfitRecommendation(
    availableGarments: Garment[],
    params: GenerateOutfitParams
  ): Promise<GeneratedOutfitRecommendation>;
}
