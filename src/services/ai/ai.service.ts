import { AIService, GarmentAnalysisResult, BackgroundRemovalResult } from "./ai.interface";
import { MockAIService } from "./mock-ai.service";
import { Garment, GarmentCategory, GARMENT_CATEGORIES } from "@/domain/garment";
import { GenerateOutfitParams, GeneratedOutfitRecommendation } from "@/domain/outfit";

export class GatewayAIService implements AIService {
  private mockFallback = new MockAIService();
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY || "";
    this.baseUrl = import.meta.env.VITE_AI_GATEWAY_URL || "https://ai.gateway.lovable.dev/v1";
  }

  private isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  async categorizeGarment(imageUrl: string): Promise<GarmentAnalysisResult> {
    if (!this.isConfigured()) {
      return this.mockFallback.categorizeGarment(imageUrl);
    }

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You analyze clothing photos. Return structured parameters for the garment.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Identify the single clothing item in this photo. Pick category, short friendly name (2-3 words), and one-word dominant color.",
                },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "tag_garment",
                description: "Return structured tags for the garment.",
                parameters: {
                  type: "object",
                  properties: {
                    category: { type: "string", enum: GARMENT_CATEGORIES },
                    name: { type: "string" },
                    color: { type: "string" },
                  },
                  required: ["category", "name", "color"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "tag_garment" } },
        }),
      });

      if (!res.ok) {
        throw new Error(`AI categorization request failed [${res.status}]`);
      }

      const json = await res.json();
      const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error("No tool arguments returned from AI");

      const parsed = JSON.parse(args) as { category: GarmentCategory; name: string; color: string };
      return {
        category: GARMENT_CATEGORIES.includes(parsed.category) ? parsed.category : "top",
        name: parsed.name.slice(0, 60),
        color: parsed.color.slice(0, 30),
      };
    } catch (err) {
      console.warn("AI Gateway error, using fallback mock AI:", err);
      return this.mockFallback.categorizeGarment(imageUrl);
    }
  }

  async removeBackground(imageUrl: string): Promise<BackgroundRemovalResult> {
    if (!this.isConfigured()) {
      return this.mockFallback.removeBackground(imageUrl);
    }

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Isolate the clothing item shown. Replace background with pure plain white (#FFFFFF). Keep garment crisp.",
                },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!res.ok) throw new Error(`Background removal failed [${res.status}]`);

      const json = await res.json();
      const cutoutDataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
      return { cutoutDataUrl };
    } catch (err) {
      console.warn("AI Background Removal failed, using fallback:", err);
      return this.mockFallback.removeBackground(imageUrl);
    }
  }

  async generateOutfitRecommendation(
    availableGarments: Garment[],
    params: GenerateOutfitParams
  ): Promise<GeneratedOutfitRecommendation> {
    if (!this.isConfigured() || availableGarments.length < 2) {
      return this.mockFallback.generateOutfitRecommendation(availableGarments, params);
    }

    try {
      const itemsList = availableGarments.map((g) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        color: g.color,
      }));

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are a professional fashion stylist AI. Select an outfit combination from the user's available garments.",
            },
            {
              role: "user",
              content: JSON.stringify({
                userRequest: params,
                availableGarments: itemsList,
              }),
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "recommend_outfit",
                description: "Recommend outfit item IDs and styling rationale.",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    selected_item_ids: { type: "array", items: { type: "string" } },
                    ai_reasoning: { type: "string" },
                    styling_tips: { type: "array", items: { type: "string" } },
                  },
                  required: ["title", "description", "selected_item_ids", "ai_reasoning", "styling_tips"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "recommend_outfit" } },
        }),
      });

      if (!res.ok) throw new Error("AI Outfit Generation failed");

      const json = await res.json();
      const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) throw new Error("No tool response from AI outfit generator");

      const parsed = JSON.parse(args);
      return {
        title: parsed.title,
        description: parsed.description,
        occasion: params.occasion,
        weather_summary: params.weather,
        selected_item_ids: parsed.selected_item_ids,
        ai_reasoning: parsed.ai_reasoning,
        styling_tips: parsed.styling_tips || [],
      };
    } catch (err) {
      console.warn("AI Outfit Recommendation failed, using fallback:", err);
      return this.mockFallback.generateOutfitRecommendation(availableGarments, params);
    }
  }
}

export const aiService: AIService = new GatewayAIService();
