import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { demoStore } from "@/lib/demo-store";

const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";

function aiKey() {
  const key = process.env.LOVABLE_API_KEY;
  return key || null;
}

const CATEGORIES = ["top", "bottom", "outerwear", "dress", "shoes", "accessory"] as const;

/* ============ List ============ */
export const listClothing = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      return { items: demoStore.getItems() };
    }

    const { data, error } = await supabase
      .from("clothing_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

/* ============ Get one ============ */
export const getClothingItem = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      const item = demoStore.getItem(data.id);
      if (!item) throw new Error("Clothing item not found");
      return { item };
    }

    const { data: row, error } = await supabase
      .from("clothing_items")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);
    return { item: row };
  });

/* ============ Delete ============ */
export const deleteClothingItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      demoStore.deleteItem(data.id);
      return { ok: true };
    }

    const { error } = await supabase
      .from("clothing_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Update tags / category ============ */
export const updateClothingItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().min(1),
        category: z.enum(CATEGORIES).optional(),
        color: z.string().min(1).max(40).optional(),
        name: z.string().min(1).max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      const { id, ...patch } = data;
      demoStore.updateItem(id, patch);
      return { ok: true };
    }

    const { id, ...patch } = data;
    const { error } = await supabase
      .from("clothing_items")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ AI: categorize an uploaded image ============ */
export const categorizeClothing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        imageUrl: z.string().url(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = aiKey();
    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You analyze clothing photos across all menswear, womenswear, unisex, streetwear, athletic, and formal wardrobes. Return ONLY the structured tool call. Be concise.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Identify the single clothing item in this photo (menswear, womenswear, or unisex). Pick the best category: 'top' (shirts, t-shirts, polos, hoodies, sweaters), 'bottom' (trousers, jeans, shorts, sweatpants, skirts), 'outerwear' (jackets, blazers, coats, overshirts), 'dress' (dresses, rompers, jumpsuits, overalls, matching one-piece sets), 'shoes' (sneakers, boots, loafers, oxfords, sandals), or 'accessory' (watches, belts, hats, ties, bags, scarves, jewelry). Give a short friendly garment name (2-3 words) and a one-word dominant color.",
            },
            { type: "image_url", image_url: { url: data.imageUrl } },
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
                category: { type: "string", enum: CATEGORIES as unknown as string[] },
                name: { type: "string" },
                color: { type: "string" },
              },
              required: ["category", "name", "color"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "tag_garment" } },
    };

    if (!key) {
      return { category: "top", name: "Classic Cotton Piece", color: "Neutral" };
    }

    try {
      const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.warn(`AI categorize returned status ${res.status}, using mock fallback.`);
        return { category: "top", name: "Styled Wardrobe Piece", color: "Neutral" };
      }
      const json = (await res.json()) as {
        choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
      };
      const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      if (!args) {
        return { category: "top" as const, name: "Clothing item", color: "neutral" };
      }
      const parsed = JSON.parse(args) as { category: string; name: string; color: string };
      const category = (CATEGORIES as readonly string[]).includes(parsed.category)
        ? (parsed.category as (typeof CATEGORIES)[number])
        : ("top" as const);
      return {
        category,
        name: parsed.name.slice(0, 60),
        color: parsed.color.slice(0, 30),
      };
    } catch (err) {
      console.warn("AI categorize failed, using fallback:", err);
      return { category: "top", name: "Styled Wardrobe Piece", color: "Neutral" };
    }
  });

/* ============ AI: remove background, return data URL of cutout ============ */
export const removeBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        imageUrl: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = aiKey();
    if (!key) {
      return { cutoutDataUrl: data.imageUrl };
    }

    try {
      const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
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
                  text:
                    "Isolate the single clothing item shown. Replace the background with pure plain white (#FFFFFF). Keep the garment crisp, centered, with natural shadows removed. No text, no watermarks.",
                },
                { type: "image_url", image_url: { url: data.imageUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });
      if (!res.ok) {
        console.warn(`Background removal returned ${res.status}, falling back to original.`);
        return { cutoutDataUrl: data.imageUrl };
      }
      const json = (await res.json()) as {
        choices?: {
          message?: {
            images?: { image_url?: { url?: string } }[];
          };
        }[];
      };
      const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      return { cutoutDataUrl: dataUrl || data.imageUrl };
    } catch (err) {
      console.warn("Background removal failed, falling back to original:", err);
      return { cutoutDataUrl: data.imageUrl };
    }
  });

/* ============ Insert clothing row ============ */
export const createClothingItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        image_url: z.string(),
        cutout_url: z.string().nullable().optional(),
        category: z.enum(CATEGORIES),
        color: z.string().min(1).max(40),
        name: z.string().min(1).max(80),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      const item = demoStore.addItem({
        image_url: data.image_url,
        cutout_url: data.cutout_url ?? null,
        category: data.category,
        color: data.color,
        name: data.name,
        ai_tags: {},
      });
      return { item };
    }

    const { data: row, error } = await supabase
      .from("clothing_items")
      .insert({
        user_id: userId,
        image_url: data.image_url,
        cutout_url: data.cutout_url ?? null,
        category: data.category,
        color: data.color,
        name: data.name,
        ai_tags: {},
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { item: row };
  });

/* ============ Batch Add Starter Essentials ============ */
export const addStarterEssentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        items: z.array(
          z.object({
            name: z.string().min(1).max(100),
            category: z.enum(CATEGORIES),
            color: z.string().min(1).max(50),
            image_url: z.string().url(),
            cutout_url: z.string().url().nullable().optional(),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      const added = demoStore.addBatchItems(
        data.items.map((it) => ({
          name: it.name,
          category: it.category,
          color: it.color,
          image_url: it.image_url,
          cutout_url: it.cutout_url ?? it.image_url,
          ai_tags: {},
        })),
      );
      return { count: added.length };
    }

    const rows = data.items.map((it) => ({
      user_id: userId,
      name: it.name,
      category: it.category,
      color: it.color,
      image_url: it.image_url,
      cutout_url: it.cutout_url ?? it.image_url,
      ai_tags: {},
    }));

    const { data: inserted, error } = await supabase
      .from("clothing_items")
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);
    return { count: inserted?.length ?? 0 };
  });

