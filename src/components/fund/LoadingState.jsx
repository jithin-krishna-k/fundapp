import { Loader2 } from "lucide-react";
import { useLang } from "@/lib/LangContext";

export default function LoadingState({ label }) {
  const { t } = useLang();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[12.5px] uppercase tracking-[0.16em] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> {label || t("ലോഡ് ചെയ്യുന്നു…", "Loading…")}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card/70" />
      ))}
    </div>
  );
}