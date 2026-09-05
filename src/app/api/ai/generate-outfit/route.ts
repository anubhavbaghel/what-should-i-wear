import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE = process.env.AI_GATEWAY_URL || "https://ai.gateway.lovable.dev/v1";
const AI_KEY = process.env.AI_API_KEY || "";

export async function POST(req: NextRequest) {
  if (!AI_KEY) {
    return NextResponse.json({ error: "AI API key not configured" }, { status: 503 });
  }

  const { garments, params } = await req.json();
  if (!garments?.length) return NextResponse.json({ error: "garments required" }, { status: 400 });

  try {
    const itemsList = garments.map((g: { id: string; name: string; category: string; color: string }) => ({
      id: g.id, name: g.name, category: g.category, color: g.color,
    }));

    const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${AI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional fashion stylist AI. Select an outfit combination from the user's available garments." },
          { role: "user", content: JSON.stringify({ userRequest: params, availableGarments: itemsList }) },
        ],
        tools: [{ type: "function", function: {
          name: "recommend_outfit",
          description: "Recommend outfit item IDs and styling rationale.",
          parameters: { type: "object", properties: {
            title: { type: "string" },
            description: { type: "string" },
            selected_item_ids: { type: "array", items: { type: "string" } },
            ai_reasoning: { type: "string" },
            styling_tips: { type: "array", items: { type: "string" } },
          }, required: ["title", "description", "selected_item_ids", "ai_reasoning", "styling_tips"] },
        } }],
        tool_choice: { type: "function", function: { name: "recommend_outfit" } },
      }),
    });

    if (!res.ok) return NextResponse.json({ error: "AI generation failed" }, { status: 502 });

    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return NextResponse.json({ error: "No AI response" }, { status: 502 });

    const parsed = JSON.parse(args);
    return NextResponse.json({
      title: parsed.title,
      description: parsed.description,
      occasion: params?.occasion ?? "Casual Daily",
      weather_summary: params?.weather ?? "Warm & Sunny",
      selected_item_ids: parsed.selected_item_ids,
      ai_reasoning: parsed.ai_reasoning,
      styling_tips: parsed.styling_tips || [],
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI request failed" }, { status: 500 });
  }
}
