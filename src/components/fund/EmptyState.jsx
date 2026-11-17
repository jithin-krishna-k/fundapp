import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLangPair } from "@/lib/LangContext";

export default function EmptyState({ ml = "ഒന്നുമില്ല", en = "Nothing here yet", icon: Icon = Inbox, action }) {
  const { primary, leadFont } = useLangPair();

  return (
    <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-muted-foreground">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <p className={cn("mt-3 text-[14.5px]", leadFont)}>{primary(ml, en)}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}