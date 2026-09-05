import { AIService, GarmentAnalysisResult, BackgroundRemovalResult } from "./ai.interface";
import { MockAIService } from "./mock-ai.service";
import type { Garment } from "@/domain/garment";
import type { GenerateOutfitParams, GeneratedOutfitRecommendation } from "@/domain/outfit";

export class GatewayAIService implements AIService {
  private mockFallback = new MockAIService();

  private isConfigured(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(window.location.origin);
  }

  async categorizeGarment(imageUrl: string): Promise<GarmentAnalysisResult> {
    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!res.ok) throw new Error(`AI categorize failed [${res.status}]`);
      return await res.json();
    } catch (err) {
      console.warn("AI categorize failed, using mock:", err);
      return this.mockFallback.categorizeGarment(imageUrl);
    }
  }

  async removeBackground(imageUrl: string): Promise<BackgroundRemovalResult> {
    try {
      const res = await fetch("/api/ai/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });

      if (!res.ok) throw new Error(`AI bg removal failed [${res.status}]`);
      return await res.json();
    } catch (err) {
      console.warn("AI bg removal failed, using mock:", err);
      return this.mockFallback.removeBackground(imageUrl);
    }
  }

  async generateOutfitRecommendation(
    availableGarments: Garment[],
    params: GenerateOutfitParams
  ): Promise<GeneratedOutfitRecommendation> {
    if (availableGarments.length < 2) {
      return this.mockFallback.generateOutfitRecommendation(availableGarments, params);
    }

    try {
      const res = await fetch("/api/ai/generate-outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garments: availableGarments, params }),
      });

      if (!res.ok) throw new Error(`AI outfit gen failed [${res.status}]`);
      return await res.json();
    } catch (err) {
      console.warn("AI outfit gen failed, using mock:", err);
      return this.mockFallback.generateOutfitRecommendation(availableGarments, params);
    }
  }
}

export const aiService: AIService = new GatewayAIService();
