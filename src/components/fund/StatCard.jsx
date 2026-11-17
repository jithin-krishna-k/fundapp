import { inr } from "@/lib/format";
import { useLangPair } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

/**
 * Dashboard figure card.
 * size="lg": large icon chip, big number, optional detail columns (top row).
 * size="sm": compact row with icon chip beside label and value (second row).
 */
export default function StatCard({ icon: Icon, labelMl, labelEn, value, prefix = "₹", details = [], size = "lg", className }) {
  const { primary, leadFont } = useLangPair();
  const shown = prefix ? inr(Number(value) || 0) : String(Number(value) || 0);

  if (size === "sm") {
    return (
      <article className={cn("card-soft flex items-center gap-4 rounded-2xl border border-border bg-card p-5", className)}>
        {Icon && (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-primary">
            <Icon className="h-[22px] w-[22px]" strokeWidth={1.9} />
          </span>
        )}
        <div className="min-w-0">
          <p className={cn("truncate text-[14.5px] font-medium text-foreground/80", leadFont)}>{primary(labelMl, labelEn)}</p>
          <p className="tnum mt-1 text-[1.35rem] font-bold leading-none tracking-tight">{shown}</p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("card-soft relative flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-6", className)}>
      {Icon && (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
          <Icon className="h-[26px] w-[26px]" strokeWidth={1.9} />
        </span>
      )}
      <div className="relative min-w-0 flex-1">
        <p className={cn("text-[15px] font-semibold text-foreground/90", leadFont)}>{primary(labelMl, labelEn)}</p>
        <p className="tnum mt-2 text-[2.1rem] font-bold leading-none tracking-tight">{shown}</p>
        {details.length > 0 && (
          <dl className="mt-5 flex divide-x divide-border">
            {details.map((detail, i) => (
              <div key={detail.label} className={cn("pr-6", i > 0 && "pl-6")}>
                <dt className={cn("text-[13px] text-muted-foreground", leadFont)}>{detail.label}</dt>
                <dd className="tnum mt-1 text-[15px] font-semibold">{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
