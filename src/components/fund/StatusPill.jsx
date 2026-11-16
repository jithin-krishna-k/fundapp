import { cn } from "@/lib/utils";

const TONES = {
  paid: "bg-emerald-600/10 text-emerald-800 border-emerald-700/15",
  pending: "bg-amber-500/12 text-amber-800 border-amber-700/15",
  overdue: "bg-red-600/10 text-red-800 border-red-700/15",
  partial: "bg-sky-600/10 text-sky-800 border-sky-700/15",
  neutral: "bg-secondary text-foreground/80 border-border",
  accent: "bg-primary/10 text-primary border-primary/20",
};

export default function StatusPill({ tone = "neutral", children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-none",
        TONES[tone] || TONES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}