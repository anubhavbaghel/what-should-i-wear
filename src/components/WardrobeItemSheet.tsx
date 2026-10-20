import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Trash2, Tag, Calendar, Palette, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type ClothingItem = Database["public"]["Tables"]["clothing_items"]["Row"];

interface WardrobeItemSheetProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}

export function WardrobeItemSheet({
  item,
  isOpen,
  onClose,
  onDelete,
}: WardrobeItemSheetProps) {
  if (!item) return null;

  const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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

          {/* Android Bottom Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-md flex-col rounded-t-[32px] border-t-[2.5px] border-x-[2.5px] border-ink bg-background shadow-2xl overflow-hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
          >
            {/* Sheet Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-ink/30" />
            </div>

            {/* Top Close bar */}
            <div className="flex items-center justify-between px-5 py-2">
              <span className="rounded-full border border-ink bg-card px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground shadow-[1px_1px_0_var(--ink)]">
                {item.category}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink bg-card text-foreground transition-transform active:scale-90"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto px-5 py-3 [scrollbar-width:thin]">
              {/* Garment Image Showcase */}
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border-[2px] border-ink bg-card shadow-[3px_3px_0_var(--ink)] flex items-center justify-center p-4">
                <img
                  src={item.cutout_url ?? item.image_url}
                  alt={item.name ?? item.category}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Title & Color Badge */}
              <div className="mt-4">
                <h2 className="display text-2xl font-black text-foreground">
                  {item.name ?? "Untitled Piece"}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-mint-soft px-3 py-1 text-xs font-bold text-ink">
                    <Palette className="h-3 w-3" />
                    {item.color}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink bg-sun-soft px-3 py-1 text-xs font-bold text-ink">
                    <Tag className="h-3 w-3" />
                    {item.category.toUpperCase()}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink/40 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
                <Link
                  to="/style"
                  onClick={onClose}
                  className="btn-pop w-full py-3 text-center text-sm font-black flex items-center justify-center gap-2 shadow-[2.5px_2.5px_0_var(--ink)]"
                  data-tone="pink"
                >
                  <Sparkles className="h-4 w-4" />
                  Try On in 3D Studio
                </Link>

                <div className="flex gap-2">
                  <Link
                    to="/closet/$itemId"
                    params={{ itemId: item.id }}
                    onClick={onClose}
                    className="btn-pop flex-1 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-1.5"
                    data-tone="card"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Edit Details
                  </Link>

                  {onDelete && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Remove "${item.name ?? "this item"}" from your closet?`)) {
                          await onDelete(item.id);
                          onClose();
                        }
                      }}
                      className="btn-pop px-4 py-2.5 text-xs font-bold text-red-600 border-red-500 hover:bg-red-50 flex items-center justify-center gap-1.5"
                      data-tone="card"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
