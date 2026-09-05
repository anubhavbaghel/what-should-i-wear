import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/services/supabase/client";
import { useAuth } from "@/lib/auth-context";

const PRESETS = [
  { id: "slim_light", label: "Slim · Light" },
  { id: "slim_medium", label: "Slim · Medium" },
  { id: "slim_dark", label: "Slim · Deep" },
  { id: "neutral_light", label: "Avg · Light" },
  { id: "neutral_medium", label: "Avg · Medium" },
  { id: "neutral_dark", label: "Avg · Deep" },
  { id: "curvy_light", label: "Curvy · Light" },
  { id: "curvy_medium", label: "Curvy · Medium" },
  { id: "curvy_dark", label: "Curvy · Deep" },
] as const;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPreset, setCurrentPreset] = useState("neutral_medium");

  const userName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    "Stylish you";
  const userEmail = user?.email ?? "";
  const userAvatar = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  }

  return (
    <div className="px-5 pt-10 pb-32">
      <header>
        <span className="sticker -rotate-2">account</span>
        <h1 className="display mt-3 text-[2.4rem] text-foreground">
          Your{" "}
          <span className="inline-block -rotate-1 rounded-xl border-[1.5px] border-ink px-2" style={{ background: "var(--pink)" }}>
            profile
          </span>
        </h1>
      </header>

      <section
        className="card-pop mt-8 flex items-center gap-4 p-5"
        style={{ background: "var(--mint-soft)" }}
      >
        <div className="h-14 w-14 overflow-hidden rounded-full border-[1.5px] border-ink bg-card">
          {userAvatar ? (
            <img src={userAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold">
              {userName?.[0]?.toUpperCase() ?? "✦"}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{userName}</p>
          <p className="truncate text-sm text-muted-foreground">{userEmail}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="display text-lg text-foreground">Default figure</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          We'll use this as the mannequin for new looks.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setCurrentPreset(p.id);
                toast.success("Figure updated");
              }}
              className="chip"
              data-active={currentPreset === p.id}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <button onClick={signOut} className="btn-pop mt-10 w-full py-4 text-sm" data-tone="paper">
        <LogOut className="h-4 w-4" /> Sign out
      </button>

      <p className="mt-10 text-center text-xs text-muted-foreground">✦ what to wear today?</p>
    </div>
  );
}
