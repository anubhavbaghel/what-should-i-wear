import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { demoStore } from "@/lib/demo-store";

const GATEWAY_BASE = "https://ai.gateway.lovable.dev/v1";

function aiKey() {
  const key = process.env.LOVABLE_API_KEY;
  return key || null;
}

const MANNEQUIN_PRESETS = [
  "neutral_light",
  "neutral_medium",
  "neutral_dark",
  "curvy_light",
  "curvy_medium",
  "curvy_dark",
  "slim_light",
  "slim_medium",
  "slim_dark",
] as const;

type MannequinPreset = (typeof MANNEQUIN_PRESETS)[number];
export type StylePresentation = "neutral" | "masculine" | "feminine";

function describePreset(
  p: MannequinPreset,
  presentation: StylePresentation = "neutral",
): string {
  const [build, skin] = p.split("_") as [string, string];
  const buildMap: Record<string, string> = {
    slim: "slim, lean silhouette",
    neutral: "regular, athletic/balanced build",
    curvy: presentation === "masculine" ? "broad-shouldered, muscular build" : "curvy, fuller silhouette",
  };
  const skinMap: Record<string, string> = {
    light: "light skin tone",
    medium: "medium skin tone",
    dark: "deep skin tone",
  };
  const genderMap: Record<StylePresentation, string> = {
    masculine: "masculine-presenting figure (menswear styling)",
    feminine: "feminine-presenting figure (womenswear styling)",
    neutral: "gender-neutral, androgynous figure (unisex styling)",
  };
  return `${genderMap[presentation] ?? genderMap.neutral}, ${buildMap[build] ?? build}, ${skinMap[skin] ?? skin}`;
}

/* ============ List outfits ============ */
export const listOutfits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      return { outfits: demoStore.getOutfits() };
    }

    const { data, error } = await supabase
      .from("outfits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { outfits: data ?? [] };
  });

/* ============ Get one outfit (with its items) ============ */
export const getOutfit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      const res = demoStore.getOutfit(data.id);
      if (res) return { outfit: res.outfit, items: res.items };
      throw new Error("Outfit not found");
    }

    const { data: outfit, error } = await supabase
      .from("outfits")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", userId)
      .single();
    if (error) throw new Error(error.message);

    let items: Array<{
      id: string;
      name: string | null;
      category: string;
      image_url: string;
      cutout_url: string | null;
    }> = [];
    if (outfit.item_ids?.length) {
      const { data: rows, error: e2 } = await supabase
        .from("clothing_items")
        .select("id,name,category,image_url,cutout_url")
        .in("id", outfit.item_ids)
        .eq("user_id", userId);
      if (e2) throw new Error(e2.message);
      items = rows ?? [];
    }
    return { outfit, items };
  });

/* ============ Delete outfit ============ */
export const deleteOutfit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      demoStore.deleteOutfit(data.id);
      return { ok: true };
    }

    const { error } = await supabase
      .from("outfits")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Rename outfit ============ */
export const renameOutfit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().min(1), name: z.string().min(1).max(80) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      demoStore.renameOutfit(data.id, data.name);
      return { ok: true };
    }

    const { error } = await supabase
      .from("outfits")
      .update({ name: data.name })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ AI: virtual try-on — generate look image ============ */
export const generateTryOn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        itemIds: z.array(z.string().min(1)).min(1).max(6),
        mannequinPreset: z.enum(MANNEQUIN_PRESETS),
        stylePresentation: z.enum(["neutral", "masculine", "feminine"]).optional(),
        name: z.string().min(1).max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    if (demoStore.isDemoUser(userId)) {
      const outfit = demoStore.addOutfit({
        name: data.name?.trim() || "New look",
        item_ids: data.itemIds,
        mannequin_preset: data.mannequinPreset,
      });
      return { outfit };
    }

    const key = aiKey();
    if (!key) {
      const outfit = demoStore.addOutfit({
        name: data.name?.trim() || "New look",
        item_ids: data.itemIds,
        mannequin_preset: data.mannequinPreset,
      });
      return { outfit };
    }

    // Load the items (must belong to user — RLS enforces too)
    const { data: items, error: itemsErr } = await supabase
      .from("clothing_items")
      .select("id,name,category,image_url,cutout_url")
      .in("id", data.itemIds)
      .eq("user_id", userId);
    if (itemsErr) throw new Error(itemsErr.message);
    if (!items || items.length === 0) throw new Error("Couldn't load those pieces.");

    const description = describePreset(data.mannequinPreset, data.stylePresentation);
    const piecesText = items
      .map((i) => `- ${i.name ?? i.category} (${i.category})`)
      .join("\n");

    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: `Create a single full-body fashion editorial photo of a stylized illustrated mannequin/figure (${description}) wearing ALL of the following clothing pieces TOGETHER as one cohesive outfit:\n${piecesText}\n\nRules:\n- Use the provided reference images for each garment — preserve their exact colors, patterns, and silhouettes.\n- Pose: standing, facing camera, relaxed, full body in frame (head to feet).\n- Background: clean solid soft cream (#FFF6F1).\n- Style: minimal, premium, magazine-quality, soft natural lighting, no text, no watermark.\n- The figure should look like a friendly illustrated/stylized mannequin (not a hyperreal photo of a real person).`,
      },
      ...items.map((i) => ({
        type: "image_url" as const,
        image_url: { url: i.cutout_url ?? i.image_url },
      })),
    ];

    try {
      const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: userContent }],
          modalities: ["image", "text"],
        }),
      });

      if (!res.ok) {
        console.warn(`Try-on generation returned status ${res.status}, using mock look.`);
        const outfit = demoStore.addOutfit({
          name: data.name?.trim() || "New look",
          item_ids: data.itemIds,
          mannequin_preset: data.mannequinPreset,
        });
        return { outfit };
      }

      const json = (await res.json()) as {
        choices?: {
          message?: { images?: { image_url?: { url?: string } }[] };
        }[];
      };
      const dataUrl = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!dataUrl) {
        const outfit = demoStore.addOutfit({
          name: data.name?.trim() || "New look",
          item_ids: data.itemIds,
          mannequin_preset: data.mannequinPreset,
        });
        return { outfit };
      }

      // Upload generated image to storage
      const blob = await (await fetch(dataUrl)).blob();
      const path = `${userId}/outfits/${Date.now()}.png`;
      const { error: upErr } = await supabase.storage
        .from("wardrobe")
        .upload(path, blob, { contentType: "image/png", upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from("wardrobe").getPublicUrl(path);
      const generatedUrl = pub.publicUrl;

      // Save outfit row
      const { data: outfit, error: insErr } = await supabase
        .from("outfits")
        .insert({
          user_id: userId,
          name: data.name?.trim() || "New look",
          item_ids: data.itemIds,
          mannequin_preset: data.mannequinPreset,
          generated_image_url: generatedUrl,
        })
        .select()
        .single();
      if (insErr) throw new Error(insErr.message);

      return { outfit };
    } catch (err) {
      console.warn("Try-on generation failed, using mock look fallback:", err);
      const outfit = demoStore.addOutfit({
        name: data.name?.trim() || "New look",
        item_ids: data.itemIds,
        mannequin_preset: data.mannequinPreset,
      });
      return { outfit };
    }
  });

/* ============ Profile: get + update mannequin preset & style presentation ============ */
export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      const dp = demoStore.getProfile();
      return {
        profile: {
          id: dp.id,
          display_name: dp.display_name,
          mannequin_preset: dp.mannequin_preset as any,
          onboarded_at: dp.onboarded_at,
          created_at: dp.onboarded_at,
          updated_at: dp.onboarded_at,
          avatar_url: null,
        },
        stylePresentation: dp.style_presentation,
        avatarConfig: dp.avatar_config,
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const { data: userData } = await supabase.auth.getUser();
    const stylePresentation =
      (userData?.user?.user_metadata?.style_presentation as StylePresentation) ?? "neutral";
    const avatarConfig = userData?.user?.user_metadata?.avatar_config ?? null;

    return { profile: data, stylePresentation, avatarConfig };
  });

export const updateMannequinPreset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        preset: z.enum(MANNEQUIN_PRESETS),
        avatarConfig: z
          .object({
            build: z.enum(["slim", "neutral", "curvy"]).optional(),
            skinToneHex: z.string().optional(),
            presentation: z.enum(["neutral", "masculine", "feminine"]).optional(),
            baseWearHex: z.string().optional(),
            heightScale: z.number().optional(),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      demoStore.updatePreset(data.preset);
      if (data.avatarConfig) demoStore.updateAvatarConfig(data.avatarConfig);
      return { ok: true };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ mannequin_preset: data.preset })
      .eq("id", userId);
    if (error) throw new Error(error.message);

    if (data.avatarConfig) {
      await supabase.auth.updateUser({
        data: { avatar_config: data.avatarConfig },
      });
    }

    return { ok: true };
  });

export const updateStylePresentation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ presentation: z.enum(["neutral", "masculine", "feminine"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      demoStore.updatePresentation(data.presentation);
      return { ok: true };
    }

    const { error } = await supabase.auth.updateUser({
      data: { style_presentation: data.presentation },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============ Onboarding: save name + preset + style presentation and mark complete ============ */
export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        displayName: z.string().min(1).max(60).optional(),
        preset: z.enum(MANNEQUIN_PRESETS),
        stylePresentation: z.enum(["neutral", "masculine", "feminine"]).optional(),
        avatarConfig: z
          .object({
            build: z.enum(["slim", "neutral", "curvy"]).optional(),
            skinToneHex: z.string().optional(),
            presentation: z.enum(["neutral", "masculine", "feminine"]).optional(),
            baseWearHex: z.string().optional(),
            heightScale: z.number().optional(),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (demoStore.isDemoUser(userId)) {
      demoStore.completeOnboarding(data);
      return { ok: true };
    }

    const patch: {
      mannequin_preset: typeof data.preset;
      onboarded_at: string;
      display_name?: string;
    } = {
      mannequin_preset: data.preset,
      onboarded_at: new Date().toISOString(),
    };
    if (data.displayName) patch.display_name = data.displayName.trim();
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId);
    if (error) throw new Error(error.message);

    const userMetadata: Record<string, any> = {};
    if (data.stylePresentation) userMetadata.style_presentation = data.stylePresentation;
    if (data.avatarConfig) userMetadata.avatar_config = data.avatarConfig;
    if (Object.keys(userMetadata).length > 0) {
      await supabase.auth.updateUser({
        data: userMetadata,
      });
    }

    return { ok: true };
  });

/* ============ Reset demo session for first-time user testing ============ */
export const resetDemoSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    demoStore.resetAsFirstTime();
    return { ok: true };
  });

/* ============ Load sample wardrobe for demo testing ============ */
export const loadDemoSampleWardrobe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    demoStore.loadSampleWardrobe();
    return { ok: true };
  });

