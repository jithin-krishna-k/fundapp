import { Link } from "@tanstack/react-router";
import { HandCoins, Banknote, Siren, ArrowLeftRight, Scale } from "lucide-react";
import { useLangPair } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { to: "/contributions", ml: "സംഭാവന അടയ്ക്കുക", en: "Pay contribution", icon: HandCoins },
  { to: "/request-fund", ml: "ഫണ്ട് ആവശ്യപ്പെടുക", en: "Request fund", icon: Banknote },
  { to: "/emergency", ml: "അടിയന്തിര അഭ്യർത്ഥന", en: "Emergency", icon: Siren },
  { to: "/transactions", ml: "ഇടപാടുകൾ", en: "Transactions", icon: ArrowLeftRight },
  { to: "/rules", ml: "ഫണ്ട് നിയമങ്ങൾ", en: "Fund rules", icon: Scale },
];

export default function QuickActions() {
  const { primary, leadFont } = useLangPair();

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className={cn("text-[16px] leading-tight", leadFont)}>{primary("വേഗത്തിലുള്ള നടപടികൾ", "Quick actions")}</h2>

      <div className="mt-5 grid flex-1 grid-cols-2 gap-3">
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className={
                (index === ACTIONS.length - 1 ? "col-span-2 " : "") +
                "group flex items-center gap-3 min-h-[4rem] rounded-xl border border-border/80 bg-background/60 px-3.5 py-3 transition-colors hover:border-primary/30 hover:bg-primary/[0.06]"
              }
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" strokeWidth={1.7} />
              </span>
              <span className="min-w-0">
                <span className={cn("block text-[14px] leading-tight", leadFont)}>{primary(action.ml, action.en)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}