import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { num } from "@/lib/format";
import { useLangPair } from "@/lib/LangContext";

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
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    setValue(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run]);

  return value;
}

export default function StatCard({ labelMl, labelEn, value, prefix = "₹", details = [], featured = false }) {
  const ref = useRef(null);
  const { lang, primary, caption, leadFont, captionFont } = useLangPair();
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

  const shown = useCountUp(Number(value) || 0, inView);

  return (
    <article
      ref={ref}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] transition-all duration-500",
        featured
          ? "col-span-2 border border-primary/15 p-5 shadow-[0_26px_55px_-40px_rgba(84,42,20,0.6)] sm:p-6"
          : "border border-border bg-card p-5 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_36px_-30px_rgba(0,0,0,0.5)] sm:p-6"
      )}
      style={
        featured
          ? {
              backgroundImage:
                "radial-gradient(125% 125% at 100% 0%, rgba(201,103,64,0.26) 0%, rgba(201,103,64,0.10) 34%, rgba(247,244,236,0) 66%), linear-gradient(160deg, #FBF1E8 0%, #F5F1E6 100%)",
            }
          : undefined
      }
    >
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={cn("text-[12.5px] font-medium leading-snug text-foreground/85", leadFont)}>
            {primary(labelMl, labelEn)}
          </p>
          <p
            className={cn(
              "mt-1 text-[10px] leading-snug text-muted-foreground/80",
              captionFont,
              lang === "ml" ? "uppercase tracking-[0.16em]" : "tracking-normal"
            )}
          >
            {caption(labelMl, labelEn)}
          </p>
        </div>
        {featured && (
          <svg viewBox="0 0 100 100" className="h-12 w-12 shrink-0 opacity-80 sm:h-14 sm:w-14" fill="hsl(var(--primary))" aria-hidden="true">
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

      <div className="relative mt-5">
        <p className="font-display tnum text-[2rem] leading-none tracking-tight sm:text-[2.4rem]">
          <span className="mr-1 text-[0.55em] text-muted-foreground/70">{prefix}</span>
          {num(shown)}
        </p>
        {details.length > 0 && (
          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-primary/10 bg-primary/[0.07]">
            {details.map((detail) => (
              <div key={detail.label} className="bg-white/55 px-3.5 py-2.5">
                <dt className="font-mal text-[10.5px] leading-none text-muted-foreground">{detail.label}</dt>
                <dd className="tnum mt-1 text-[13px] font-medium text-foreground">{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
