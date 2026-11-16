import { cn } from "@/lib/utils";
import { useLangPair } from "@/lib/LangContext";

export default function SectionHeading({ ml, en, action, className }) {
  const { primary, caption, leadFont, captionFont } = useLangPair();

  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className={cn("text-[1.05rem] leading-tight text-foreground", leadFont)}>{primary(ml, en)}</h2>
        <p className={cn("mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground", captionFont)}>
          {caption(ml, en)}
        </p>
      </div>
      {action}
    </div>
  );
}