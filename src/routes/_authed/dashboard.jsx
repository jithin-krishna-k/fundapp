import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ClipboardCheck, HandCoins, Siren } from "lucide-react";
import StatCard from "@/components/fund/StatCard";
import SectionHeading from "@/components/fund/SectionHeading";
import WeeklyCard from "@/components/dashboard/WeeklyCard";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import EmptyState from "@/components/fund/EmptyState";
import { useFund } from "@/lib/FundContext";
import { useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";
import { addDays, formatDate, inr, isoDate, startOfWeek } from "@/lib/format";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

const ACTIVITY_TYPE = {
  weekly_contribution: "contribution",
  fund_withdrawal: "withdrawal",
  loan_repayment: "repayment",
  late_interest: "interest",
  borrowing_interest: "interest",
  fund_expense: "withdrawal",
  interest_distribution: "interest",
  other: "request",
};

const ACTIVITY_LABEL = {
  weekly_contribution: { ml: "ആഴ്ച സംഭാവന", en: "Weekly contribution" },
  fund_withdrawal: { ml: "ഫണ്ട് നൽകിയ വായ്പ", en: "Fund lent out" },
  loan_repayment: { ml: "വായ്പ തിരിച്ചടവ്", en: "Loan repayment" },
  late_interest: { ml: "കാലതാമസ പലിശ", en: "Late interest" },
  borrowing_interest: { ml: "വായ്പ പലിശ", en: "Borrowing interest" },
  fund_expense: { ml: "ഫണ്ട് ചെലവുകൾ", en: "Fund expense" },
  interest_distribution: { ml: "പലിശ വിതരണം", en: "Interest distribution" },
  other: { ml: "മറ്റ് ഇടപാട്", en: "Other transaction" },
};

function DashboardPage() {
  const fund = useFund();
  const { lang, t } = useLang();
  const { settings, summary, members, myMember, transactions, withdrawals, weekContributions } = fund;
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(formatDate(new Date(), lang === "en" ? "en-IN" : "ml-IN"));
  }, [lang]);

  const weekStart = isoDate(startOfWeek(new Date()));
  const weekEnd = isoDate(addDays(startOfWeek(new Date()), 6));
  const paid = weekContributions.filter((c) => c.status === "paid");
  const pending = weekContributions.filter((c) => c.status !== "paid");
  const firstName = (myMember?.full_name || "").split(" ")[0];

  const pendingVerification = transactions.filter((t) => t.status === "pending").length;
  const pendingRequests = withdrawals.filter((w) => ["submitted", "under_review"].includes(w.status)).length;

  const activities = transactions.slice(0, 6).map((row) => {
    const label = ACTIVITY_LABEL[row.category];
    return {
      type: ACTIVITY_TYPE[row.category] || "request",
      title: `${row.member_name || "FUND"} · ${label ? t(label.ml, label.en) : t("മറ്റ് ഇടപാട്", "Other transaction")}`,
      meta: `${row.method === "cash" ? t("ക്യാഷ്", "Cash") : t("ഓൺലൈൻ", "Online")} · ${row.status === "verified" ? t("പരിശോധിച്ചു", "Verified") : row.status === "pending" ? t("പരിശോധനയിൽ", "Pending") : t("നിരസിച്ചു", "Rejected")} · ${row.ref || ""}`,
      amount: Number(row.amount) || 0,
      when: formatDate(row.txn_date || row.created_date),
    };
  });

  return (
    <div className="page-enter space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mal text-[12.5px] uppercase tracking-[0.2em] text-muted-foreground">{today || "\u00a0"}</p>
          <h1 className={cn("mt-2 text-[1.6rem] leading-tight sm:text-[1.9rem]", lang === "en" ? "" : "font-mal")}>
            {t("നമസ്കാരം", "Welcome")}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p
            className={cn(
              "mt-1 text-[12.5px] uppercase tracking-[0.18em] text-muted-foreground",
              lang === "en" ? "font-mal" : ""
            )}
          >
            {fund.cycle?.name || "Fund group"} · {t("അംഗങ്ങൾക്ക് മാത്രം", "members only")}
          </p>
        </div>
      </header>

      <section>
        <SectionHeading
          ml="സാമ്പത്തിക സ്ഥിതി"
          en="Financial summary"
          action={
            <Link to="/reports" className="text-[12.5px] uppercase tracking-[0.14em] text-primary hover:underline">
              Reports
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            featured
            labelMl="ആകെ ഫണ്ട് ബാലൻസ്"
            labelEn="Total fund balance"
            value={summary.balance}
            details={[
              { label: t("ക്യാഷ്", "Cash"), value: inr(summary.cashBalance) },
              { label: t("അംഗങ്ങൾ", "Members"), value: String(summary.members) },
            ]}
          />
          <StatCard
            labelMl="ആകെ സംഭാവന"
            labelEn="Total contributions"
            value={summary.contributionsTotal}
          />
          <StatCard labelMl="നൽകിയ വായ്പ" labelEn="Total money lent" value={summary.lent} />
          <StatCard labelMl="ബാക്കി തുക" labelEn="Total outstanding" value={summary.outstanding} />
          <StatCard
            labelMl="ലഭിച്ച പലിശ"
            labelEn="Interest collected"
            value={summary.interestCollected}
          />
          <StatCard
            labelMl="ഈ ആഴ്ചയിലെ ശേഖരണം"
            labelEn="Collected this week"
            value={weekContributions.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0)}
          />
          <StatCard
            labelMl="ആകെ അംഗങ്ങൾ"
            labelEn="Total members"
            value={summary.members}
            prefix=""
          />
        </div>
      </section>

      {(pendingVerification > 0 || pendingRequests > 0) && (fund.isHandler || fund.isAdmin) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {pendingVerification > 0 && (
            <Link
              to="/transactions"
              className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/[0.06] px-5 py-4"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/12 text-primary">
                <ClipboardCheck className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[14px]", lang === "en" ? "" : "font-mal")}>
                  {t("പരിശോധിക്കാനുള്ള പേയ്‌മെന്റുകൾ", "Payments to verify")}
                </span>
                <span
                  className={cn(
                    "block text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground",
                    lang === "en" ? "font-mal" : ""
                  )}
                >
                  {pendingVerification} {t("പരിശോധനയിൽ", "pending verification")}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-primary" strokeWidth={1.7} />
            </Link>
          )}
          {pendingRequests > 0 && (
            <Link
              to="/request-fund"
              className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground/70">
                <HandCoins className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block text-[14px]", lang === "en" ? "" : "font-mal")}>
                  {t("അനുമതിക്കായുള്ള ഫണ്ട് അഭ്യർത്ഥനകൾ", "Fund requests awaiting approval")}
                </span>
                <span
                  className={cn(
                    "block text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground",
                    lang === "en" ? "font-mal" : ""
                  )}
                >
                  {pendingRequests} {t("തീരുമാനത്തിനായി കാത്തിരിക്കുന്നു", "awaiting decision")}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} />
            </Link>
          )}
        </section>
      )}

      <section className="grid items-stretch gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {weekContributions.length === 0 ? (
            <div className="h-full rounded-2xl border border-border bg-card p-5 sm:p-6">
              <EmptyState
                icon={HandCoins}
                ml="ഈ ആഴ്ചയുടെ സംഭാവന രേഖകൾ ഇല്ല"
                en="This week's contributions are not generated yet"
                action={
                  <Link
                    to="/contributions"
                    className="rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground"
                  >
                    {t("സംഭാവന വിഭാഗത്തിലേക്ക്", "Go to contributions")}
                  </Link>
                }
              />
            </div>
          ) : (
            <WeeklyCard
              week={{
                amount: settings?.weekly_amount || 250,
                paid: paid.length,
                total: weekContributions.length,
                range: `${formatDate(weekStart)} – ${formatDate(weekEnd)}`,
                deadline: formatDate(weekEnd),
                next: formatDate(isoDate(addDays(weekStart, 7))),
                paidMembers: paid.map((c) => c.member_name),
                pendingMembers: pending.map((c) => c.member_name),
              }}
            />
          )}
        </div>
        <QuickActions />
      </section>

      {activities.length === 0 ? (
        <section>
          <SectionHeading ml="സമീപകാല ഇടപാടുകൾ" en="Recent activity" />
          <EmptyState
            icon={Siren}
            ml="ഇടപാടുകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല"
            en="No transactions recorded yet"
            action={
              <Link
                to="/contributions"
                className="rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground"
              >
                {t("ആദ്യ സംഭാവന രേഖപ്പെടുത്തുക", "Record the first contribution")}
              </Link>
            }
          />
        </section>
      ) : (
        <ActivityFeed items={activities} />
      )}

      <p className="pt-2 text-center text-[11.5px] uppercase tracking-[0.2em] text-muted-foreground/70">
        Transparency · Trust · Friendship · Accountability
      </p>
    </div>
  );
}
