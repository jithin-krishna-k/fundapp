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
            lang === "en" ? "text-[12px]" : "font-mal text-[12px]",
          )}
        >
          {lang === "en" ? "Fund group · Members only" : "ഫണ്ട് ഗ്രൂപ്പ് · അംഗങ്ങൾക്ക് മാത്രം"}
        </p>
      )}
    </div>
  );
}
