import { useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { code: "ml", label: "മലയാളം", short: "മ" },
  { code: "en", label: "English", short: "EN" },
];

export default function LangToggle({ className, compact = false, iconOnly = false }) {
  const { lang, setLang } = useLang();

  if (iconOnly) {
    const next = lang === "en" ? "ml" : "en";
    const label = lang === "en" ? "Switch to Malayalam" : "Switch to English";
    const isEn = lang === "en";
    return (
      <button
        type="button"
        onClick={() => setLang(next)}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <span className={cn("leading-none", isEn ? "text-[11px] font-semibold tracking-wide" : "font-mal text-[15px]")}>
          {isEn ? "EN" : "മ"}
        </span>
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={cn("inline-flex shrink-0 items-center rounded-full border border-border bg-muted p-0.5", className)}
    >
      {OPTIONS.map((option) => {
        const selected = option.code === lang;
        return (
          <button
            key={option.code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setLang(option.code)}
            className={cn(
              "inline-flex min-h-[32px] min-w-[36px] items-center justify-center rounded-full px-2.5 py-1 text-[13px] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:min-w-0",
              option.code === "ml" && "font-mal",
              selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {compact ? option.short : option.label}
          </button>
        );
      })}
    </div>
  );
}
