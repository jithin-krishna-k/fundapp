import { inr } from "@/lib/format";
import { useLangPair } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

export default function WeeklyCard({ week }) {
  const { primary, leadFont } = useLangPair();
  const amount = Number(week.amount) || 0;
  const paid = Number(week.paid) || 0;
  const total = Number(week.total) || 0;
  const pct = total ? Math.round((paid / total) * 100) : 0;
  const pendingMembers = week.pendingMembers || [];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className={cn("text-[16px] leading-tight", leadFont)}>
            {primary("ഈ ആഴ്ചയിലെ സംഭാവന", "This week's contributions")}
          </h2>
        </div>
        <p className="shrink-0 text-[13.5px] text-muted-foreground">{week.range}</p>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="font-display tnum text-[2rem] leading-none tracking-tight sm:text-[2.35rem]">
          {inr(paid * amount)}
          <span className="ml-2 text-[0.45em] font-normal text-muted-foreground">
            / {inr(total * amount)}
          </span>
        </p>
        <p className="tnum shrink-0 text-[14.5px] font-medium text-primary">
          {paid}/{total} {primary("അടച്ചു", "paid")}
        </p>
      </div>

      <div className="mb-6 mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>

      <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-5">
        <div>
          <dt className={cn("text-[12.5px] text-muted-foreground", leadFont)}>{primary("അവസാന തീയതി", "Due by")}</dt>
          <dd className="tnum mt-1 text-[14.5px] font-medium">{week.deadline}</dd>
        </div>
        <div className="min-w-0">
          <dt className={cn("text-[12.5px] text-muted-foreground", leadFont)}>{primary("ബാക്കിയുള്ളവർ", "Yet to pay")}</dt>
          <dd className="mt-1 truncate text-[14.5px] font-medium">
            {pendingMembers.length ? pendingMembers.join(", ") : primary("എല്ലാവരും അടച്ചു", "Everyone has paid")}
          </dd>
        </div>
      </dl>
    </article>
  );
}
