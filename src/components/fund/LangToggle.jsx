import { useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { code: "ml", label: "മലയാളം", short: "മ" },
  { code: "en", label: "English", short: "EN" },
];

export default function LangToggle({ className, compact = false, iconOnly = false }) {
  const { lang, setLang } = useLang();

  // Narrow rail (collapsed sidebar): one square button that flips the language.
  if (iconOnly) {
    const next = lang === "en" ? "ml" : "en";
    const label = lang === "en" ? "Switch to Malayalam" : "ഇംഗ്ലീഷിലേക്ക് മാറുക";
    return (
      <button
        type="button"
        onClick={() => setLang(next)}
        aria-label={label}
        title={label}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground/80 transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        {lang === "en" ? (
          <span className="text-[13px] font-semibold leading-none tracking-wide">EN</span>
        ) : (
          <span className="font-mal text-[17px] leading-none">മ</span>
        )}
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className={cn("inline-flex items-center rounded-full border border-border bg-muted p-0.5", className)}
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
              "rounded-full px-2.5 py-1 text-[13px] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              option.code === "ml" && (compact ? "font-mal text-[15px]" : "font-mal"),
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
