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
    <article className="card-soft flex h-full flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className={cn("flex items-center gap-2.5 text-[17px] font-semibold", leadFont)}>
          <BarChart3 className="h-5 w-5 text-primary" strokeWidth={2.2} />
          {primary("ഈ ആഴ്ചയിലെ സംഭാവന", "This week's contributions")}
        </h2>
        <p className="tnum shrink-0 text-[13.5px] text-muted-foreground">{week.range}</p>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <p className="tnum text-[2rem] font-bold leading-none tracking-tight">
          {inr(collected)}
          <span className="ml-2 text-[15px] font-medium text-muted-foreground">/ {inr(expected)}</span>
        </p>
        <span className="tnum shrink-0 rounded-lg bg-accent px-2.5 py-1 text-[13.5px] font-semibold text-primary">
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
      <div className="mt-6 flex flex-1 gap-3" aria-label={primary("ദിവസേനയുള്ള ശേഖരണം", "Daily collection")}>
        <div className="tnum flex h-44 flex-col justify-between pb-0 text-right text-[12px] text-muted-foreground">
          {ticks.map((tick) => (
            <span key={tick} className="leading-none">
              {tick}
            </span>
          ))}
        </div>
        <div className="flex-1">
          <div className="relative h-44 border-b border-l border-border">
            {[0, 1, 2].map((i) => (
              <div key={i} className="absolute inset-x-0 border-t border-dashed border-border" style={{ top: `${(i / 3) * 100}%` }} />
            ))}
            <div className="absolute inset-0 grid grid-cols-7">
              {days.map((day) => (
                <div key={day.key} className="flex items-end justify-center border-r border-border/60 last:border-r-0">
                  {day.value > 0 && (
                    <div
                      title={`${day.label} · ${inr(day.value)}`}
                      className="w-[45%] max-w-[44px] rounded-t-md bg-gradient-to-t from-primary to-primary/70"
                      style={{ height: `${(day.value / top) * 100}%` }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-7 text-center">
            {days.map((day) => (
              <div key={day.key} className={cn("leading-tight", day.today ? "text-primary" : "text-foreground/80")}>
                <p className={cn("text-[12.5px]", day.today && "font-semibold", leadFont)}>{day.label}</p>
                <p className="tnum text-[11.5px] text-muted-foreground">{day.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
