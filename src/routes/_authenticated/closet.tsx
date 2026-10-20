import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Camera,
  Sparkles,
  Search,
  SlidersHorizontal,
  X,
  Layers,
  Shirt,
  Scissors,
  CheckCircle2,
  PackagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { listClothing, deleteClothingItem, addStarterEssentials } from "@/lib/closet.functions";
import { getProfile, loadDemoSampleWardrobe } from "@/lib/outfits.functions";
import { StarterWardrobeSheet } from "@/components/StarterWardrobeSheet";
import { WardrobeItemSheet } from "@/components/WardrobeItemSheet";
import type { WardrobeEssential } from "@/lib/starter-essentials";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type ClothingItem = Database["public"]["Tables"]["clothing_items"]["Row"];

export const Route = createFileRoute("/_authenticated/closet")({
  head: () => ({
    meta: [
      { title: "Digital Wardrobe — What to Wear Today?" },
      { name: "description", content: "Your Android-style digital wardrobe." },
    ],
  }),
  component: ClosetPage,
});

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "top", label: "Tops" },
  { id: "bottom", label: "Bottoms" },
  { id: "outerwear", label: "Outerwear" },
  { id: "dress", label: "Dresses & Sets" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessories" },
] as const;

function ClosetPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listClothing);
  const fetchProfile = useServerFn(getProfile);
  const seedWardrobe = useServerFn(loadDemoSampleWardrobe);
  const addEssentialsFn = useServerFn(addStarterEssentials);
  const deleteItemFn = useServerFn(deleteClothingItem);

  const { data, isLoading } = useQuery({
    queryKey: ["closet"],
    queryFn: () => fetchList(),
  });
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  });

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isStarterSheetOpen, setIsStarterSheetOpen] = useState(false);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const items: ClothingItem[] = data?.items ?? [];

  // Filter and search logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.color && item.color.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [items, activeCategory, searchQuery]);

  // Dynamic counts per category
  const counts = useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const item of items) {
      map[item.category] = (map[item.category] || 0) + 1;
    }
    return map;
  }, [items]);

  async function handleBatchAddEssentials(selected: WardrobeEssential[]) {
    try {
      await addEssentialsFn({
        data: {
          items: selected.map((s) => ({
            name: s.name,
            category: s.category,
            color: s.color,
            image_url: s.image_url,
            cutout_url: s.cutout_url,
          })),
        },
      });
      await qc.invalidateQueries({ queryKey: ["closet"] });
      toast.success(`Added ${selected.length} essential pieces to your wardrobe! ✦`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add essentials");
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      await deleteItemFn({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["closet"] });
      toast.success("Piece removed from wardrobe");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete item");
    }
  }

  return (
    <div className="relative min-h-screen bg-background pb-32">
      {/* Android Top App Bar */}
      <header className="sticky top-0 z-30 border-b-[2px] border-ink/15 bg-background/95 px-4 pt-4 pb-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-md border border-ink bg-pink text-[10px] font-black text-ink shadow-[1px_1px_0_var(--ink)]">
                ✦
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Digital Wardrobe
              </span>
            </div>
            <h1 className="display text-2xl font-black text-foreground">
              My Closet
            </h1>
          </div>

          {/* Quick stats pill */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsStarterSheetOpen(true)}
              className="btn-pop flex items-center gap-1.5 px-3 py-1.5 text-xs font-black shadow-[1.5px_1.5px_0_var(--ink)]"
              data-tone="sun"
            >
              <PackagePlus className="h-3.5 w-3.5" />
              <span>Essentials</span>
            </button>
          </div>
        </div>

        {/* Android Search & Filter Bar */}
        <div className="mt-3 relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-ink/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, color, style..."
            className="w-full rounded-xl border-[1.5px] border-ink bg-card py-2 pl-9 pr-9 text-xs font-semibold text-foreground placeholder:text-muted-foreground shadow-[2px_2px_0_var(--ink)] focus:outline-none focus:ring-1 focus:ring-ink"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-ink/40 hover:text-ink active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Category Chips Bar */}
        <div className="-mx-4 mt-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-1.5">
            {CATEGORIES.map((cat) => {
              const count = counts[cat.id] || 0;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border-[1.5px] border-ink px-3 py-1 text-xs font-bold transition-all active:scale-95 shrink-0 shadow-[1.5px_1.5px_0_var(--ink)]",
                    isActive
                      ? "bg-ink text-background shadow-none"
                      : "bg-card text-foreground hover:bg-card-pop/40"
                  )}
                >
                  <span>{cat.label}</span>
                  <span
                    className={cn(
                      "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black",
                      isActive
                        ? "bg-background text-ink"
                        : "bg-ink/10 text-ink/80"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="aspect-square animate-pulse rounded-2xl border-[1.5px] border-ink/20 bg-muted/60"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="card-pop mx-auto mt-6 max-w-sm p-6 text-center" style={{ background: "var(--sun-soft)" }}>
            <span className="sticker rotate-2" style={{ background: "var(--pink)" }}>
              {items.length === 0 ? "Empty Closet" : "No Matches"}
            </span>
            <h3 className="display mt-4 text-2xl font-black text-foreground">
              {items.length === 0 ? "Start your collection" : "No items match your filter"}
            </h3>
            <p className="mx-auto mt-2 text-xs text-muted-foreground">
              {items.length === 0
                ? "Tap 'Starter Essentials' to load classic capsule pieces instantly, or scan your real clothes."
                : `We couldn't find any items matching "${searchQuery}". Try clearing the search or category filter.`}
            </p>

            <div className="mt-5 flex flex-col gap-2">
              {items.length === 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsStarterSheetOpen(true)}
                    className="btn-pop w-full py-2.5 text-xs font-black shadow-[2px_2px_0_var(--ink)]"
                    data-tone="pink"
                  >
                    <PackagePlus className="h-4 w-4" /> Pick Starter Essentials (1-Tap)
                  </button>
                  <Link
                    to="/closet/add"
                    className="btn-pop w-full py-2.5 text-xs font-bold shadow-[2px_2px_0_var(--ink)]"
                    data-tone="card"
                  >
                    <Camera className="h-4 w-4" /> Scan with Camera
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("all");
                  }}
                  className="btn-pop mx-auto px-4 py-2 text-xs font-bold"
                  data-tone="card"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Garment Grid with Android touch interaction */
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                onClick={() => setSelectedItem(item)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border-[2px] border-ink bg-card shadow-[2.5px_2.5px_0_var(--ink)] cursor-pointer transition-all active:scale-[0.97] active:shadow-[1px_1px_0_var(--ink)]"
              >
                {/* Category Pill Tag */}
                <div className="absolute top-2 left-2 z-10">
                  <span className="rounded-full border border-ink bg-background/90 backdrop-blur-xs px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-foreground shadow-[1px_1px_0_var(--ink)]">
                    {item.category}
                  </span>
                </div>

                {/* Garment Cutout Image */}
                <div className="relative aspect-square w-full overflow-hidden bg-card-pop/20 p-3 flex items-center justify-center">
                  <img
                    src={item.cutout_url ?? item.image_url}
                    alt={item.name ?? item.category}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Garment Card Footer */}
                <div className="border-t-[1.5px] border-ink bg-card px-2.5 py-2">
                  <h4 className="line-clamp-1 text-xs font-black text-foreground">
                    {item.name ?? `${item.color} ${item.category}`}
                  </h4>
                  <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                    <span className="truncate">{item.color}</span>
                    <span className="text-pink font-bold">Inspect ✦</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) Menu - Native Android Pattern */}
      <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-2.5">
        <AnimatePresence>
          {isFabMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="flex flex-col items-end gap-2"
            >
              {/* Option 1: Starter Essentials */}
              <button
                type="button"
                onClick={() => {
                  setIsFabMenuOpen(false);
                  setIsStarterSheetOpen(true);
                }}
                className="flex items-center gap-2 rounded-full border-[2px] border-ink bg-sun px-4 py-2 text-xs font-black text-ink shadow-[3px_3px_0_var(--ink)] active:scale-95 transition-transform"
              >
                <span>Add Essentials</span>
                <PackagePlus className="h-4 w-4" />
              </button>

              {/* Option 2: Scan / Upload Item */}
              <Link
                to="/closet/add"
                onClick={() => setIsFabMenuOpen(false)}
                className="flex items-center gap-2 rounded-full border-[2px] border-ink bg-pink px-4 py-2 text-xs font-black text-ink shadow-[3px_3px_0_var(--ink)] active:scale-95 transition-transform"
              >
                <span>Scan Piece</span>
                <Camera className="h-4 w-4" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary FAB Button */}
        <button
          type="button"
          onClick={() => setIsFabMenuOpen((prev) => !prev)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] border-ink bg-pink text-ink shadow-[4px_4px_0_var(--ink)] transition-transform active:scale-90",
            isFabMenuOpen && "rotate-45 bg-sun"
          )}
          aria-label="Add garments"
        >
          <Plus className="h-7 w-7" strokeWidth={3} />
        </button>
      </div>

      {/* Android Bottom Sheets */}
      <StarterWardrobeSheet
        isOpen={isStarterSheetOpen}
        onClose={() => setIsStarterSheetOpen(false)}
        onAddEssentials={handleBatchAddEssentials}
      />

      <WardrobeItemSheet
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onDelete={handleDeleteItem}
      />
    </div>
  );
}
