import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE = process.env.AI_GATEWAY_URL || "https://ai.gateway.lovable.dev/v1";
const AI_KEY = process.env.AI_API_KEY || "";
const CATEGORIES = ["top", "bottom", "outerwear", "dress", "shoes", "accessory"] as const;

export async function POST(req: NextRequest) {
  if (!AI_KEY) {
    return NextResponse.json({ error: "AI API key not configured" }, { status: 503 });
  }

  const { imageUrl } = await req.json();
  if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 });

  try {
    const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${AI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You analyze clothing photos. Return ONLY the structured tool call. Be concise." },
          { role: "user", content: [
            { type: "text", text: "Identify the single clothing item in this photo. Pick the best category. Give a short, friendly garment name (2-3 words) and a one-word dominant color." },
            { type: "image_url", image_url: { url: imageUrl } },
          ] },
        ],
        tools: [{ type: "function", function: {
          name: "tag_garment",
          description: "Return structured tags for the garment.",
          parameters: { type: "object", properties: {
            category: { type: "string", enum: CATEGORIES as unknown as string[] },
            name: { type: "string" },
            color: { type: "string" },
          }, required: ["category", "name", "color"], additionalProperties: false },
        } }],
        tool_choice: { type: "function", function: { name: "tag_garment" } },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `AI error [${res.status}]: ${txt}` }, { status: 502 });
    }

    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return NextResponse.json({ category: "top", name: "Clothing item", color: "neutral" });

    const parsed = JSON.parse(args);
    const category = (CATEGORIES as readonly string[]).includes(parsed.category) ? parsed.category : "top";
    return NextResponse.json({ category, name: parsed.name.slice(0, 60), color: parsed.color.slice(0, 30) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI request failed" }, { status: 500 });
  }
}
