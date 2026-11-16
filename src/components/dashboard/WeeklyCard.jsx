import { useEffect, useRef, useState } from "react";
import { inr } from "@/lib/format";
import { useLangPair } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

const DOTS = [
  [14, 14, 0.54],
  [38, 14, 0.36],
  [62, 14, 0.18],
  [86, 14, 0],
  [38, 38, 0.54],
  [62, 38, 0.36],
  [86, 38, 0.18],
  [62, 62, 0.54],
  [86, 62, 0.36],
  [86, 86, 0.54],
];

function useCountUp(target, run) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!run || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame;
    let start;
    const duration = 1100;

    const tick = (ts) => {
      if (!start) start = ts;

      const progress = Math.min((ts - start) / duration, 1);
      setValue(target * (1 - Math.pow(1 - progress, 3)));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    setValue(0);
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [target, run]);

  return value;
}

export default function WeeklyCard({ week }) {
  const ref = useRef(null);
  const { primary, caption, leadFont, captionFont } = useLangPair();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shown = useCountUp(Number(week.value) || 0, inView);

  return (
    <article
      ref={ref}
      className={cn(
        "relative flex flex-col justify-between gap-6 overflow-hidden rounded-[1.4rem] p-5 transition-all duration-500 sm:p-6",
        week.week === "featured"
          ? "col-span-2 border border-primary/15 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.45)]"
          : "border border-border bg-card hover:border-primary/25 hover:shadow-[0_14px_30px_-26px_rgba(0,0,0,0.5)]"
      )}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-[13px] leading-tight text-muted-foreground", leadFont)}>
            {primary(week.labelMl, week.labelEn)}
          </p>

          <p className={cn("mt-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80", captionFont)}>
            {caption(week.labelMl, week.labelEn)}
          </p>
        </div>

        {week.featured && (
          <svg
            viewBox="0 0 100 100"
            className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
            fill="hsl(var(--primary))"
            aria-hidden="true"
          >
            {DOTS.map(([cx, cy, delay], i) => (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={9}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  transform: inView ? "scale(1)" : "scale(0.82)",
                  opacity: inView ? 1 : 0.3,
                  transition: `transform .5s cubic-bezier(.22,1,.36,1) ${delay}s, opacity .5s ease ${delay}s`,
                }}
              />
            ))}
          </svg>
        )}
      </div>

      <div className="relative">
        <p className="font-display tnum text-[2rem] leading-none tracking-tight sm:text-[2.35rem]">
          <span className="mr-0.5 text-[0.6em] text-muted-foreground/70">
            {week.prefix}
          </span>
          {inr(shown)}
        </p>

        {week.details?.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {week.details.map((detail) => (
              <div key={detail.label}>
                <dt className="font-mal text-[11px] text-muted-foreground">
                  {detail.label}
                </dt>
                <dd className="tnum text-[13px] font-medium text-foreground">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}