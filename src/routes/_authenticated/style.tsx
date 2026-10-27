import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Sparkles, Loader2, Camera, Check } from "lucide-react";
import { listClothing } from "@/lib/closet.functions";
import { generateTryOn, getProfile } from "@/lib/outfits.functions";
import { MannequinAvatar, BuildType, SkinToneType } from "@/components/MannequinAvatar";
import { ThreeMannequinViewer } from "@/components/ThreeMannequinViewer";
import { BodyTypeSelector } from "@/components/BodyTypeSelector";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/style")({
  head: () => ({
    meta: [
      { title: "Style — What to Wear Today?" },
      { name: "description", content: "Mix pieces and generate a fresh look on your mannequin." },
    ],
  }),
  component: StylePage,
});

const CATEGORY_GROUPS = [
  { id: "top", label: "Tops" },
  { id: "bottom", label: "Bottoms" },
  { id: "outerwear", label: "Outerwear" },
  { id: "dress", label: "Dresses & Sets" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessories" },
] as const;

const PRESENTATIONS = [
  { id: "neutral", label: "✦ Unisex / Neutral" },
  { id: "masculine", label: "👔 Menswear" },
  { id: "feminine", label: "👗 Womenswear" },
] as const;

type Presentation = (typeof PRESENTATIONS)[number]["id"];

const PRESETS = [
  { id: "slim_light", label: "Slim · Light" },
  { id: "slim_medium", label: "Slim · Medium" },
  { id: "slim_dark", label: "Slim · Deep" },
  { id: "neutral_light", label: "Athletic · Light" },
  { id: "neutral_medium", label: "Athletic · Medium" },
  { id: "neutral_dark", label: "Athletic · Deep" },
  { id: "curvy_light", label: "Broad/Curvy · Light" },
  { id: "curvy_medium", label: "Broad/Curvy · Medium" },
  { id: "curvy_dark", label: "Broad/Curvy · Deep" },
] as const;

type Preset = (typeof PRESETS)[number]["id"];

function StylePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchList = useServerFn(listClothing);
  const fetchProfile = useServerFn(getProfile);
  const tryOn = useServerFn(generateTryOn);

  const { data: closet, isLoading } = useQuery({
    queryKey: ["closet"],
    queryFn: () => fetchList(),
  });
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const [selected, setSelected] = useState<string[]>([]);
  const [preset, setPreset] = useState<Preset>("neutral_medium");
  const [presentation, setPresentation] = useState<Presentation>("neutral");
  const [generating, setGenerating] = useState(false);
  const [showFigureSettings, setShowFigureSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");

  useEffect(() => {
    const p = profileData?.profile?.mannequin_preset as Preset | undefined;
    if (p) setPreset(p);
    if (profileData?.stylePresentation) {
      setPresentation(profileData.stylePresentation as Presentation);
    }
  }, [profileData]);

  const items = closet?.items ?? [];
  const grouped = useMemo(() => {
    const map: Record<string, typeof items> = {};
    for (const it of items) {
      (map[it.category] ??= []).push(it);
    }
    return map;
  }, [items]);

  const [build, skin] = (preset.split("_") as [BuildType, SkinToneType]) || ["neutral", "medium"];

  const skinToneHex = useMemo(() => {
    if (skin === "light") return "#FCE5D8";
    if (skin === "dark") return "#6D4835";
    return "#D59D7B";
  }, [skin]);

  const selectedItems = useMemo(
    () => items.filter((it) => selected.includes(it.id)),
    [items, selected],
  );

  const clothingLayers = useMemo(() => {
    const top = selectedItems.find((i) => i.category === "top" || i.category === "dress");
    const bottom = selectedItems.find((i) => i.category === "bottom");
    const outer = selectedItems.find((i) => i.category === "outerwear");
    const shoes = selectedItems.find((i) => i.category === "shoes");
    return {
      topUrl: top ? (top.cutout_url ?? top.image_url) : null,
      bottomUrl: bottom ? (bottom.cutout_url ?? bottom.image_url) : null,
      outerwearUrl: outer ? (outer.cutout_url ?? outer.image_url) : null,
      shoesUrl: shoes ? (shoes.cutout_url ?? shoes.image_url) : null,
    };
  }, [selectedItems]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function generate() {
    if (selected.length === 0) {
      toast.error("Pick at least one piece.");
      return;
    }
    setGenerating(true);
    try {
      const { outfit } = await tryOn({
        data: { itemIds: selected, mannequinPreset: preset, stylePresentation: presentation },
      });
      await qc.invalidateQueries({ queryKey: ["outfits"] });
      toast.success("Look generated ✦");
      navigate({ to: "/outfits/$outfitId", params: { outfitId: outfit.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't generate. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="px-5 pt-10 pb-40">
      <header>
        <span className="sticker -rotate-2" style={{ background: "var(--sun)" }}>try on</span>
        <h1 className="display mt-3 text-[2.4rem] text-foreground">
          Style a{" "}
          <span className="inline-block rotate-1 rounded-xl border-[1.5px] border-ink px-2" style={{ background: "var(--sun)" }}>
            look
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick pieces from your closet to dress the mannequin, then generate your look.
        </p>
      </header>

      {/* Live Interactive Mannequin Stage */}
      <div className="card-pop mt-6 p-4 text-center" style={{ background: "var(--card)" }}>
        {/* Stage Header Controls */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {/* 3D vs 2D View Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-full border border-ink/15">
            <button
              type="button"
              onClick={() => setViewMode("3d")}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all",
                viewMode === "3d" ? "bg-sun text-ink border border-ink shadow-xs" : "text-muted-foreground hover:text-ink"
              )}
            >
              ✦ 3D Mixamo
            </button>
            <button
              type="button"
              onClick={() => setViewMode("2d")}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all",
                viewMode === "2d" ? "bg-card text-ink border border-ink shadow-xs" : "text-muted-foreground hover:text-ink"
              )}
            >
              2D Schematic
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowFigureSettings((v) => !v)}
              className="chip text-[11px]"
              data-active={showFigureSettings}
            >
              {showFigureSettings ? "Hide Figure" : "✦ Customize Figure"}
            </button>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="chip text-[11px] text-muted-foreground hover:text-ink"
              >
                Clear fit
              </button>
            )}
          </div>
        </div>

        {/* Viewport: 3D Mixamo Model vs 2D Schematic */}
        {viewMode === "3d" ? (
          <div className="w-full">
            <ThreeMannequinViewer
              modelType="xbot"
              build={build}
              skinToneHex={skinToneHex}
              presentation={presentation}
              className="h-72 w-full"
            />
          </div>
        ) : (
          <div className="relative flex items-center justify-center h-60 w-full">
            <MannequinAvatar
              build={build}
              skinTone={skin}
              presentation={presentation}
              size="lg"
              clothingLayers={clothingLayers}
            />
          </div>
        )}

        <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
          {selected.length === 0
            ? "Tap pieces below to dress your mannequin"
            : `${selected.length} piece${selected.length > 1 ? "s" : ""} on mannequin`}
        </p>

        {showFigureSettings && (
          <div className="w-full mt-5 pt-5 border-t-[1.5px] border-ink/15 text-left">
            <BodyTypeSelector
              value={preset}
              onChange={(p) => setPreset(p as Preset)}
              presentation={presentation}
              onPresentationChange={(pr) => setPresentation(pr as Presentation)}
              showPresentationToggle={true}
            />
          </div>
        )}
      </div>

      {/* Item picker */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="display text-lg text-foreground">Pick pieces</h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {selected.length} selected
          </span>
        </div>

        {isLoading ? (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl border-[1.5px] border-ink/20 bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card-pop mt-5 px-6 py-10 text-center" style={{ background: "var(--pink-soft)" }}>
            <p className="text-sm font-semibold text-foreground">No pieces yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Add a few items to start styling.</p>
            <Link to="/closet/add" className="btn-pop mt-5 px-5 py-2.5 text-sm" data-tone="pink">
              <Camera className="h-4 w-4" /> Scan a piece
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {CATEGORY_GROUPS.map((g) => {
              const list = grouped[g.id];
              if (!list?.length) return null;
              return (
                <div key={g.id}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {g.label}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {list.map((it) => {
                      const active = selected.includes(it.id);
                      return (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => toggle(it.id)}
                          className={cn(
                            "card-pop relative aspect-square overflow-hidden transition-transform",
                            active && "translate-x-[2px] translate-y-[2px]",
                          )}
                          style={{ background: active ? "var(--mint)" : "var(--card)" }}
                        >
                          <img
                            src={it.cutout_url ?? it.image_url}
                            alt={it.name ?? ""}
                            className="h-full w-full object-cover"
                          />
                          {active && (
                            <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-ink bg-mint text-ink">
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sticky generate */}
      {items.length > 0 && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 bottom-24 z-30 px-5"
        >
          <div className="mx-auto max-w-md">
            <button
              onClick={generate}
              disabled={generating || selected.length === 0}
              className="btn-pop w-full py-4 text-base disabled:opacity-60"
              data-tone="pink"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Styling…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate look
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
