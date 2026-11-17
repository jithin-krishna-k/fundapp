import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, ArrowRight, Banknote, Clock3, FileText, HandCoins, Percent, Siren } from "lucide-react";
import { inr } from "@/lib/format";
import { useLangPair } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

// Icon and tint per activity type; money coming in reads green, going out reads violet.
const TYPES = {
  contribution: { icon: HandCoins, chip: "bg-emerald-50 text-emerald-600", amount: "text-emerald-600" },
  repayment: { icon: ArrowLeftRight, chip: "bg-emerald-50 text-emerald-600", amount: "text-emerald-600" },
  interest: { icon: Percent, chip: "bg-accent text-primary", amount: "text-emerald-600" },
  withdrawal: { icon: Banknote, chip: "bg-violet-50 text-violet-600", amount: "text-violet-600" },
  request: { icon: FileText, chip: "bg-accent text-primary", amount: "text-foreground" },
  emergency: { icon: Siren, chip: "bg-red-50 text-red-600", amount: "text-red-600" },
};

export default function ActivityFeed({ items }) {
  const { primary, leadFont } = useLangPair();

  return (
    <section className="card-soft rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className={cn("flex items-center gap-2.5 text-[17px] font-semibold", leadFont)}>
          <Clock3 className="h-5 w-5 text-primary" strokeWidth={2.1} />
          {primary("സമീപകാല ഇടപാടുകൾ", "Recent activity")}
        </h2>
        <Link to="/transactions" className={cn("flex items-center gap-1 text-[14px] font-medium text-primary hover:underline", leadFont)}>
          {primary("എല്ലാം കാണുക", "View all")}
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-border">
        {items.map((item, index) => {
          const type = TYPES[item.type] || TYPES.request;
          const Icon = type.icon;
          return (
            <li key={index} className="flex items-center gap-4 py-3.5 last:pb-0">
              <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", type.chip)}>
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-[14.5px] font-medium", leadFont)}>{item.title}</p>
                <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                  {item.meta} · {item.when}
                </p>
              </div>
              <p className={cn("tnum shrink-0 text-[15px] font-semibold", type.amount)}>{inr(item.amount)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
