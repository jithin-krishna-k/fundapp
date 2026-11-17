import { cn } from "@/lib/utils";
import { useLang, useLangPair } from "@/lib/LangContext";

export default function PageHeader({ ml, en, description, action, className }) {
  const { lang } = useLang();
  const { primary, leadFont } = useLangPair();

  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        <h1 className={cn("break-words text-[1.35rem] leading-tight sm:text-[1.7rem]", leadFont)}>{primary(ml, en)}</h1>
        {description && <p className={cn("mt-2 max-w-xl break-words text-[14px] leading-relaxed text-muted-foreground sm:mt-3", lang === "en" ? "" : "font-mal")}>{description}</p>}
      </div>
      {action && <div className="w-full sm:w-auto sm:shrink-0">{action}</div>}
    </header>
  );
}