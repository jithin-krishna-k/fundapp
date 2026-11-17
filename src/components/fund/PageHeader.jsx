import { cn } from "@/lib/utils";
import { useLang, useLangPair } from "@/lib/LangContext";

export default function PageHeader({ ml, en, description, action, className }) {
  const { lang } = useLang();
  const { primary, leadFont } = useLangPair();

  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className={cn("text-[1.5rem] leading-tight sm:text-[1.7rem]", leadFont)}>{primary(ml, en)}</h1>
        {description && <p className="mt-3 max-w-xl
  font-mal text-[14px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}