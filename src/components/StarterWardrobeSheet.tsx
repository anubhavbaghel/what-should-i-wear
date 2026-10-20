import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Sparkles, Filter, CheckCircle2 } from "lucide-react";
import { STARTER_ESSENTIALS, type WardrobeEssential } from "@/lib/starter-essentials";
import { cn } from "@/lib/utils";

interface StarterWardrobeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEssentials: (selected: WardrobeEssential[]) => Promise<void>;
}

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "top", label: "Tops" },
  { id: "bottom", label: "Bottoms" },
  { id: "outerwear", label: "Outerwear" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessories" },
  { id: "dress", label: "Sets & Dresses" },
] as const;

export function StarterWardrobeSheet({
  isOpen,
  onClose,
  onAddEssentials,
}: StarterWardrobeSheetProps) {
  // Default to selecting the recommended foundational pieces (about 6 pieces)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(
      STARTER_ESSENTIALS.filter((e) => e.recommended).map((e) => e.id)
    );
  });
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = useMemo(() => {
    if (activeTab === "all") return STARTER_ESSENTIALS;
    return STARTER_ESSENTIALS.filter((e) => e.category === activeTab);
  }, [activeTab]);

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const item of filteredItems) {
        next.add(item.id);
      }
      return next;
    });
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  async function handleConfirm() {
    if (selectedIds.size === 0) return;
    const itemsToAdd = STARTER_ESSENTIALS.filter((e) => selectedIds.has(e.id));
    setIsSubmitting(true);
    try {
      await onAddEssentials(itemsToAdd);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Android-style Bottom Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] w-full max-w-md flex-col rounded-t-[32px] border-t-[2.5px] border-x-[2.5px] border-ink bg-background shadow-2xl overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            {/* Sheet Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-ink/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b-[1.5px] border-ink/15 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border-[1.5px] border-ink bg-sun text-xs font-black shadow-[1.5px_1.5px_0_var(--ink)]">
                  ✦
                </span>
                <div>
                  <h3 className="text-base font-black tracking-tight text-foreground">
                    Starter Essentials Builder
                  </h3>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Build your capsule wardrobe in 1 tap
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink bg-card text-foreground transition-transform active:scale-90"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Category tabs */}
            <div className="overflow-x-auto border-b-[1.5px] border-ink/10 px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex items-center gap-1.5">
                {CATEGORY_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      "chip text-[11px] py-1 px-2.5 shrink-0 transition-all active:scale-95",
                      activeTab === t.id && "bg-ink text-background shadow-none"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch actions & Counter bar */}
            <div className="flex items-center justify-between bg-card px-5 py-2 text-xs font-semibold border-b border-ink/10">
              <span className="text-muted-foreground">
                <strong className="text-foreground">{selectedIds.size}</strong> of {STARTER_ESSENTIALS.length} selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="text-pink hover:underline active:opacity-75"
                >
                  Select category
                </button>
                <span className="text-ink/20">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-muted-foreground hover:underline active:opacity-75"
                >
                  Clear all
                </button>
              </div>
            </div>

            {/* Scrollable Grid of items */}
            <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={cn(
                        "group relative flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-ink bg-card p-2 cursor-pointer transition-all active:scale-[0.98]",
                        isSelected
                          ? "ring-2 ring-ink shadow-[3px_3px_0_var(--ink)] bg-mint/15"
                          : "opacity-80 hover:opacity-100 shadow-[1.5px_1.5px_0_var(--ink)]"
                      )}
                    >
                      {/* Badge if any */}
                      {item.badge && (
                        <span className="absolute top-2 left-2 z-10 rounded-full border border-ink bg-sun px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-ink shadow-[1px_1px_0_var(--ink)]">
                          {item.badge}
                        </span>
                      )}

                      {/* Selection checkbox pill */}
                      <div
                        className={cn(
                          "absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-ink transition-transform",
                          isSelected
                            ? "bg-ink text-background scale-105"
                            : "bg-card text-transparent"
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </div>

                      {/* Item Cutout Image */}
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-card-pop/40 p-2">
                        <img
                          src={item.cutout_url}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>

                      {/* Item Details */}
                      <div className="mt-2 flex flex-col">
                        <h4 className="line-clamp-1 text-xs font-black text-foreground">
                          {item.name}
                        </h4>
                        <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{item.color}</span>
                          <span className="uppercase font-semibold tracking-wider text-[9px] text-ink/60">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="border-t-[1.5px] border-ink/20 bg-background/95 p-4 backdrop-blur-md">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedIds.size === 0 || isSubmitting}
                className="btn-pop w-full py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[3px_3px_0_var(--ink)] disabled:opacity-50 disabled:cursor-not-allowed"
                data-tone="pink"
              >
                <Sparkles className="h-4 w-4" />
                {isSubmitting
                  ? "Adding to your wardrobe..."
                  : `Add ${selectedIds.size} Selected ${selectedIds.size === 1 ? "Piece" : "Pieces"} to Closet`}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
