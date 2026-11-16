import { cn } from "@/lib/utils";
import { useLang } from "@/lib/LangContext";

export default function Logo({ compact = false, className }) {
  const { lang } = useLang();
  return (
    <div className={cn("flex flex-col", className)}>
      <p
        style={{ fontFamily: '"Archivo Black", "Plus Jakarta Sans", sans-serif', fontWeight: 400 }}
        className={cn(
          "leading-none tracking-[-0.01em] text-foreground",
          compact ? "text-[1.25rem]" : "text-[1.55rem]",
        )}
      >
        FUND
      </p>
      {!compact && (
        <p
          className={cn(
            "mt-1.5 leading-none text-muted-foreground",
            lang === "en" ? "text-[10.5px]" : "font-mal text-[10.5px]",
          )}
        >
          ഫണ്ട് ഗ്രൂപ്പ് <span className="mx-1 text-border">|</span>
          <span className="text-[9px] uppercase tracking-[0.14em]">Members only</span>
        </p>
      )}
    </div>
  );
}
