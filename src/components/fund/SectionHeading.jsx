import { cn } from "@/lib/utils";
import { useLangPair } from "@/lib/LangContext";

export default function SectionHeading({ ml, en, action, className }) {
  const { primary, leadFont } = useLangPair();

  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className={cn("text-[1.05rem] leading-tight text-foreground", leadFont)}>{primary(ml, en)}</h2>
      </div>
      {action}
    </div>
  );
}