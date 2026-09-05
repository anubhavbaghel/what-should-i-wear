import { AIService, GarmentAnalysisResult, BackgroundRemovalResult } from "./ai.interface";
import { Garment, GarmentCategory } from "@/domain/garment";
import { GenerateOutfitParams, GeneratedOutfitRecommendation } from "@/domain/outfit";

export class MockAIService implements AIService {
  async categorizeGarment(imageUrl: string): Promise<GarmentAnalysisResult> {
    await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay

    const categories: GarmentCategory[] = ["top", "bottom", "outerwear", "shoes", "accessory", "dress"];
    const colors = ["Cream", "Black", "Pastel Pink", "Mint Green", "Navy", "Sage"];
    const names: Record<GarmentCategory, string[]> = {
      top: ["Cozy Linen Shirt", "Ribbed Crop Tank", "Oversized Tee", "Knit Sweater"],
      bottom: ["Wide Leg Trousers", "Denim Shorts", "Pleated Midi Skirt", "Straight Leg Jeans"],
      outerwear: ["Classic Trench Coat", "Cropped Denim Jacket", "Tailored Blazer"],
      dress: ["Floral Sundress", "Satin Slip Dress", "Casual T-Shirt Dress"],
      shoes: ["Chunky White Sneakers", "Leather Loafers", "Strappy Sandals"],
      accessory: ["Canvas Tote Bag", "Leather Belt", "Minimalist Sunglasses"],
    };

    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryNames = names[randomCategory];
    const randomName = categoryNames[Math.floor(Math.random() * categoryNames.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      category: randomCategory,
      name: randomName,
      color: randomColor,
    };
  }

  async removeBackground(imageUrl: string): Promise<BackgroundRemovalResult> {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate background cutout delay
    // Returns original or clean mock background url indicator
    return { cutoutDataUrl: imageUrl };
  }

  async generateOutfitRecommendation(
    availableGarments: Garment[],
    params: GenerateOutfitParams
  ): Promise<GeneratedOutfitRecommendation> {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (availableGarments.length === 0) {
      throw new Error("Add at least a top and bottom to your closet for AI recommendations!");
    }

    const tops = availableGarments.filter((g) => g.category === "top" || g.category === "dress");
    const bottoms = availableGarments.filter((g) => g.category === "bottom");
    const outerwears = availableGarments.filter((g) => g.category === "outerwear");
    const shoes = availableGarments.filter((g) => g.category === "shoes");
    const accessories = availableGarments.filter((g) => g.category === "accessory");

    const selectedIds: string[] = [];

    const top = tops[Math.floor(Math.random() * tops.length)] || availableGarments[0];
    selectedIds.push(top.id);

    if (top.category !== "dress" && bottoms.length > 0) {
      const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
      selectedIds.push(bottom.id);
    }

    if (outerwears.length > 0 && Math.random() > 0.5) {
      const outer = outerwears[Math.floor(Math.random() * outerwears.length)];
      selectedIds.push(outer.id);
    }

    if (shoes.length > 0) {
      const shoe = shoes[Math.floor(Math.random() * shoes.length)];
      selectedIds.push(shoe.id);
    }

    if (accessories.length > 0 && Math.random() > 0.4) {
      const acc = accessories[Math.floor(Math.random() * accessories.length)];
      selectedIds.push(acc.id);
    }

    return {
      title: `${params.styleVibe} ${params.occasion} Look`,
      description: `A curated ${top.color.toLowerCase()} combination tailored for ${params.weather.toLowerCase()} conditions.`,
      occasion: params.occasion,
      weather_summary: params.weather,
      selected_item_ids: selectedIds,
      ai_reasoning: `Paired ${top.name} with complementary textures and tones to achieve an effortless ${params.styleVibe.toLowerCase()} aesthetic.`,
      styling_tips: [
        "Tuck in front slightly for an elongated silhouette",
        "Roll up sleeves once for a relaxed, effortless vibe",
        "Layer minimalist jewelry to complete the ensemble",
      ],
    };
  }
}
