import { Link } from "@tanstack/react-router";
import { Ban, Clock3, ShieldCheck } from "lucide-react";
import Logo from "@/components/fund/Logo";
import { useAuth } from "@/lib/AuthContext";
import { useLang } from "@/lib/LangContext";
import { useFund } from "@/lib/FundContext";
import { cn } from "@/lib/utils";

export default function PendingAccess({ member }) {
  const { t } = useLang();
  const { lang } = useLang();
  const { logout } = useAuth();
  const fund = useFund();
  const removed = member?.status === "inactive" || member?.status === "removed";
  const declined = removed && member?.join_result === "declined";
  // Rule 9 progress: how many active members have approved this request so far.
  const voters = (fund?.members || []).filter((m) => m.status === "active");
  const voterIds = new Set(voters.map((m) => m.id));
  const approvals = (member?.join_votes || []).filter((v) => v.decision === "approve" && voterIds.has(v.member_id)).length;

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
          {declined
            ? t("അംഗത്വ അഭ്യർത്ഥന നിരസിച്ചു", "Membership request declined")
            : removed
            ? t("അംഗത്വം ഒഴിവാക്കി", "Membership removed")
            : t("അംഗത്വം അനുമതിക്കായി കാത്തിരിക്കുന്നു", "Membership awaiting approval")}
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground font-mal text-[14.5px] leading-relaxed">
          {declined
            ? t(
                "ഗ്രൂപ്പിലെ ഒരു അംഗം നിങ്ങളുടെ അഭ്യർത്ഥന നിരസിച്ചു (നിയമം 9). വിവരങ്ങൾക്ക് ഗ്രൂപ്പ് അഡ്മിനെ സമീപിക്കുക.",
                "A member of the group declined your request (rule 9). Contact the group admin for details."
              )
            : removed
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
            {voters.length > 0 && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-[13.5px] font-medium">
                  {t(`${approvals} / ${voters.length} അംഗങ്ങൾ അനുമതി നൽകി`, `${approvals} of ${voters.length} members approved`)}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((approvals / voters.length) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[12px] uppercase tracking-[0.14em] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.7} /> Members only
        </div>
      </div>
    </div>
  );
}