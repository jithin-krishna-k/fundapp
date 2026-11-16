import { cn } from "@/lib/utils";
import { useLang, useLangPair } from "@/lib/LangContext";

export default function PageHeader({ ml, en, description, action, className }) {
  const { lang } = useLang();
  const { primary, caption, leadFont, captionFont } = useLangPair();

  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className={cn("text-[1.5rem] leading-tight sm:text-[1.7rem]", leadFont)}>{primary(ml, en)}</h1>
        <p className={cn("mt-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground", captionFont)}>
          {caption(ml, en)}
        </p>
        {description && <p className="mt-3 max-w-xl
  font-mal text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}