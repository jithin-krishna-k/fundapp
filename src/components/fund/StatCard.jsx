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
      <article className={cn("card-soft flex min-w-0 items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5", className)}>
        {Icon && (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary sm:h-12 sm:w-12">
            <Icon className="h-5 w-5 sm:h-[22px] sm:w-[22px]" strokeWidth={1.9} />
          </span>
        )}
        <div className="min-w-0">
          <p className={cn("break-words text-[14px] font-medium text-foreground/80 sm:text-[14.5px]", leadFont)}>{primary(labelMl, labelEn)}</p>
          <p className="tnum mt-1 text-[1.2rem] font-bold leading-none tracking-tight sm:text-[1.35rem]">{shown}</p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("card-soft relative flex min-w-0 gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 sm:gap-4 sm:p-6", className)}>
      {Icon && (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary sm:h-14 sm:w-14">
          <Icon className="h-6 w-6 sm:h-[26px] sm:w-[26px]" strokeWidth={1.9} />
        </span>
      )}
      <div className="relative min-w-0 flex-1">
        <p className={cn("break-words text-[14px] font-semibold text-foreground/90 sm:text-[15px]", leadFont)}>{primary(labelMl, labelEn)}</p>
        <p className="tnum mt-2 break-all text-[1.6rem] font-bold leading-none tracking-tight sm:text-[2.1rem]">{shown}</p>
        {details.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:flex sm:divide-x sm:divide-border sm:gap-0">
            {details.map((detail, i) => (
              <div key={detail.label} className={cn("min-w-0", i === 0 ? "sm:pr-6" : "sm:pl-6 sm:pr-0")}>
                <dt className={cn("break-words text-[13px] text-muted-foreground", leadFont)}>{detail.label}</dt>
                <dd className="tnum mt-1 break-all text-[14px] font-semibold sm:text-[15px]">{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
