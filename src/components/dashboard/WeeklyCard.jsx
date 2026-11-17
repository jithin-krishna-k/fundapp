import { BarChart3 } from "lucide-react";
import { inr } from "@/lib/format";
import { useLangPair } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

// Rounds the chart's top value up to a tidy number so the gridlines read cleanly.
function niceMax(value) {
  if (value <= 0) return 100;
  const step = Math.pow(10, Math.floor(Math.log10(value)));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (value <= m * step) return m * step;
  }
  return 10 * step;
}

export default function WeeklyCard({ week }) {
  const { primary, leadFont } = useLangPair();
  const amount = Number(week.amount) || 0;
  const paid = Number(week.paid) || 0;
  const total = Number(week.total) || 0;
  const expected = total * amount;
  const collected = Number(week.collected ?? paid * amount) || 0;
  const pct = expected ? Math.min(100, Math.round((collected / expected) * 100)) : 0;
  const days = week.days || [];
  const top = niceMax(Math.max(expected, ...days.map((d) => d.value)));
  const ticks = [top, (top * 2) / 3, top / 3, 0].map((v) => Math.round(v));

  return (
    <article className="card-soft flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className={cn("flex min-w-0 items-center gap-2.5 text-[16px] font-semibold sm:text-[17px]", leadFont)}>
          <BarChart3 className="h-5 w-5 shrink-0 text-primary" strokeWidth={2.2} />
          <span className="break-words">{primary("ഈ ആഴ്ചയിലെ സംഭാവന", "This week's contributions")}</span>
        </h2>
        <p className="tnum text-[13px] text-muted-foreground sm:shrink-0 sm:text-[13.5px]">{week.range}</p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <p className="tnum break-words text-[1.6rem] font-bold leading-none tracking-tight sm:text-[2rem]">
          {inr(collected)}
          <span className="ml-2 text-[14px] font-medium text-muted-foreground sm:text-[15px]">/ {inr(expected)}</span>
        </p>
        <span className="tnum inline-flex w-fit shrink-0 rounded-lg bg-accent px-2.5 py-1 text-[13px] font-semibold text-primary sm:text-[13.5px]">
          {paid}/{total} {primary("അടച്ചു", "paid")}
        </span>
      </div>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>

      {/* Daily collection chart: one bar per day of the current week. */}
      <div className="mt-6 overflow-x-auto pb-1">
        <div className="flex min-w-[280px] flex-1 gap-2 sm:min-w-0 sm:gap-3" aria-label={primary("ദിവസേനയുള്ള ശേഖരണം", "Daily collection")}>
          <div className="tnum flex h-36 flex-col justify-between pb-0 text-right text-[11px] text-muted-foreground sm:h-44 sm:text-[12px]">
            {ticks.map((tick) => (
              <span key={tick} className="leading-none">
                {tick}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative h-36 border-b border-l border-border sm:h-44">
              {[0, 1, 2].map((i) => (
                <div key={i} className="absolute inset-x-0 border-t border-dashed border-border" style={{ top: `${(i / 3) * 100}%` }} />
              ))}
              <div className="absolute inset-0 grid grid-cols-7">
                {days.map((day) => (
                  <div key={day.key} className="flex items-end justify-center border-r border-border/60 last:border-r-0">
                    {day.value > 0 && (
                      <div
                        title={`${day.label} — ${inr(day.value)}`}
                        className="w-[55%] max-w-[44px] rounded-t-md bg-gradient-to-t from-primary to-primary/70 sm:w-[45%]"
                        style={{ height: `${(day.value / top) * 100}%` }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-0.5 text-center">
              {days.map((day) => (
                <div key={day.key} className={cn("min-w-0 leading-tight", day.today ? "text-primary" : "text-foreground/80")}>
                  <p className={cn("truncate text-[11px] sm:text-[12.5px]", day.today && "font-semibold", leadFont)}>{day.label}</p>
                  <p className="tnum truncate text-[10.5px] text-muted-foreground sm:text-[11.5px]">{day.date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
