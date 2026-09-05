import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, Trash2 } from "lucide-react";
import { closetRepository } from "@/services/supabase/closet.repository";
import { useAuth } from "@/lib/auth-context";

export default function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ["clothing-item", itemId],
    queryFn: () => closetRepository.getGarmentById(user?.id ?? "demo", itemId!),
    enabled: !!itemId,
  });

  async function onDelete() {
    if (!item) return;
    if (!confirm("Remove this piece from your closet?")) return;
    try {
      await closetRepository.deleteGarment(user?.id ?? "demo", item.id);
      await queryClient.invalidateQueries({ queryKey: ["closet"] });
      toast.success("Removed");
      navigate("/closet");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete.");
    }
  }

  return (
    <div className="px-5 pt-10 pb-32">
      <button
        onClick={() => navigate("/closet")}
        className="-ml-2 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" /> Closet
      </button>

      {isLoading || !item ? (
        <div className="mt-6 aspect-square animate-pulse rounded-3xl border-[1.5px] border-ink/20 bg-muted" />
      ) : (
        <>
          <div className="card-pop mt-4 overflow-hidden" style={{ background: "var(--pink-soft)" }}>
            <div className="aspect-square">
              <img
                src={item.cutout_url ?? item.image_url}
                alt={item.name ?? ""}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="display text-3xl text-foreground">{item.name}</h1>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                {item.color} · {item.category}
              </p>
            </div>
            <span className="sticker rotate-3" style={{ background: "var(--sun)" }}>in closet</span>
          </div>

          <button
            onClick={onDelete}
            className="btn-pop mt-8 w-full py-4 text-sm"
            data-tone="paper"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </>
      )}
    </div>
  );
}
