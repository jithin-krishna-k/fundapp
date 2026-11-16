import { Languages } from "lucide-react";
import { useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { code: "ml", label: "മലയാളം" },
  { code: "en", label: "EN" },
];

export default function LangToggle({ className, showIcon = true }) {
  const { lang, setLang } = useLang();

  // Show only the language that is NOT currently selected
  // This way, when English is selected, only Malayalam is shown (and vice versa)
  const optionsToShow = OPTIONS.filter((option) => option.code !== lang);

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-card/80 p-0.5",
        className
      )}
    >
      {showIcon && <Languages className="ml-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.7} />}
      {optionsToShow.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => setLang(option.code)}
          aria-pressed={false}
          className={cn(
            "rounded-full px-2 py-1 text-[11px] leading-none transition-colors",
            option.code === "ml" ? "font-mal" : "tracking-[0.1em]",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}