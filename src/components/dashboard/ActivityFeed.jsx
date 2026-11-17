import { HandCoins, Banknote, Siren, ArrowLeftRight, Percent, FileText } from "lucide-react";
import { inr } from "@/lib/format";
import { useLangPair, useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

const ICONS = {
  contribution: HandCoins,
  withdrawal: Banknote,
  repayment: ArrowLeftRight,
  interest: Percent,
  request: FileText,
  emergency: Siren,
};

export default function ActivityFeed({ items }) {
  const { primary, leadFont } = useLangPair();
  const { lang } = useLang();

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className={cn("text-[16px] leading-tight", leadFont)}>{primary("സമീപകാല ഇടപാടുകൾ", "Recent activity")}</h2>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-border/70">
        {items.map((item, index) => {
          const Icon = ICONS[item.type] || FileText;
          return (
            <li key={index} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/70 bg-background text-muted-foreground">
                <Icon className="h-4 w-4" strokeWidth={1.7} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate", lang === "en" ? "text-[14px] leading-tight" : "font-mal text-[14px] leading-tight")}>{item.title || primary(item.ml, item.en)}</p>
                <p className="mt-1 truncate text-[12px] text-muted-foreground">
                  {item.meta} <span className="mx-1 text-border">·</span> {item.when}
                </p>
              </div>
              <p className="tnum shrink-0 text-[14px] font-medium">{inr(item.amount)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}