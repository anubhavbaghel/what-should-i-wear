import { NextRequest, NextResponse } from "next/server";

const GATEWAY_BASE = process.env.AI_GATEWAY_URL || "https://ai.gateway.lovable.dev/v1";
const AI_KEY = process.env.AI_API_KEY || "";

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
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: [
          { type: "text", text: "Isolate the single clothing item shown. Replace the background with pure plain white (#FFFFFF). Keep the garment crisp, centered, with natural shadows removed. No text, no watermarks." },
          { type: "image_url", image_url: { url: imageUrl } },
        ] }],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `AI error [${res.status}]: ${txt}` }, { status: 502 });
    }

    const json = await res.json();
    const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
    return NextResponse.json({ cutoutDataUrl: dataUrl });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI request failed" }, { status: 500 });
  }
}
