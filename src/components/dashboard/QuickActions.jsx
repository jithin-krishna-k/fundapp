import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, CreditCard, Cross, Scale, Send, Zap } from "lucide-react";
import { useLangPair } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { to: "/contributions", ml: "സംഭാവന അടയ്ക്കുക", en: "Pay contribution", icon: CreditCard },
  { to: "/request-fund", ml: "ഫണ്ട് ആവശ്യപ്പെടുക", en: "Request fund", icon: Send },
  { to: "/emergency", ml: "അടിയന്തിര അഭ്യർത്ഥന", en: "Emergency", icon: Cross },
  { to: "/transactions", ml: "ഇടപാടുകൾ", en: "Transactions", icon: ArrowLeftRight },
  { to: "/rules", ml: "ഫണ്ട് നിയമങ്ങൾ", en: "Fund rules", icon: Scale },
];

export default function QuickActions() {
  const { primary, leadFont } = useLangPair();

  return (
    <section className="card-soft flex h-full flex-col rounded-2xl border border-border bg-card p-6">
      <h2 className={cn("flex items-center gap-2.5 text-[17px] font-semibold", leadFont)}>
        <Zap className="h-5 w-5 fill-amber-400 text-amber-400" strokeWidth={2} />
        {primary("വേഗത്തിലുള്ള നടപടികൾ", "Quick actions")}
      </h2>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className={cn(
                "flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40 hover:bg-accent/50 sm:min-h-[3.75rem]",
                index === ACTIONS.length - 1 && "sm:col-span-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.9} />
              <span className={cn("min-w-0 break-words text-[14px] font-medium leading-snug", leadFont)}>{primary(action.ml, action.en)}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
