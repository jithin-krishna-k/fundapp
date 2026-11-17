import { Link } from "@tanstack/react-router";
import { Ban, Clock3, ShieldCheck } from "lucide-react";
import Logo from "@/components/fund/Logo";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

export default function PendingAccess({ member }) {
  const { t } = useLang();
  const { lang } = useLang();
  const { logout } = useAuth();
  const removed = member?.status === "inactive" || member?.status === "removed";

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-md rounded-[1.6rem] border border-border bg-card p-7 text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <div className={cn("mx-auto mt-7 grid h-12 w-12 place-items-center rounded-full",
          removed ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
          {removed ? <Ban className="h-5 w-5" strokeWidth={1.7} /> : <Clock3 className="h-5 w-5" strokeWidth={1.7} />}
        </div>
        <h1 className="mt-4 text-[1.15rem] leading-snug font-mal text-[1.15rem] leading-snug">
          {removed
            ? t("അംഗത്വം ഒഴിവാക്കി", "Membership removed")
            : t("അംഗത്വം അനുമതിക്കായി കാത്തിരിക്കുന്നു", "Membership awaiting approval")}
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground font-mal text-[14.5px] leading-relaxed">
          {removed
            ? t(
                "സൂപ്പർ അഡ്മിൻ നിങ്ങളെ ഈ ഫണ്ട് ഗ്രൂപ്പിൽ നിന്ന് ഒഴിവാക്കി. വീണ്ടും അംഗമാകാൻ ഗ്രൂപ്പ് അഡ്മിനെ സമീപിക്കുക.",
                "The super admin removed you from this fund group. Contact the group admin if you wish to rejoin."
              )
            : t(
                "നിയമം 9 അനുസരിച്ച് പുതിയ അംഗത്തെ ഉൾപ്പെടുത്താൻ എല്ലാ ഗ്രൂപ്പംഗങ്ങളുടെയും അനുവാദം ആവശ്യമാണ്. അനുമതി ലഭിച്ചാൽ നിങ്ങൾക്ക് ഫണ്ട് കാണാനാകും.",
                "Under rule 9, adding a new member needs everyone's approval. You can see the fund once approved."
              )}
        </p>
        {removed ? (
          <button
            onClick={logout}
            className="mt-6 rounded-full border border-border bg-background px-4 py-2 text-[13px] text-foreground/80"
          >
            {t("സൈൻ ഔട്ട്", "Sign out")}
          </button>
        ) : (
          <div className="mt-5 rounded-xl border border-border bg-background/70 px-4 py-3 text-left">
            <p className="text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground">Requested by</p>
            <p className="mt-1 text-[14.5px] font-mal text-[14.5px]">{member?.full_name}</p>
            <p className="text-[13px] text-muted-foreground">{member?.user_email}</p>
          </div>
        )}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.7} /> Members only
        </div>
      </div>
    </div>
  );
}