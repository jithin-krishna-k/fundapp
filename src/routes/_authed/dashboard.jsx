import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardCheck,
  HandCoins,
  ShieldCheck,
  Siren,
} from "lucide-react";
import StatCard from "@/components/fund/StatCard";
import WeeklyCard from "@/components/dashboard/WeeklyCard";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import EmptyState from "@/components/fund/EmptyState";
import { useFund } from "@/lib/FundContext";
import { useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";
import { addDays, formatDate, formatDateTime, inr, startOfWeek } from "@/lib/format";

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

// Local calendar day as YYYY-MM-DD (toISOString would shift it to UTC).
function localKey(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A transaction's day: date-only strings are already local days; timestamps are converted.
function txnDayKey(row) {
  const raw = row.txn_date || row.created_date;
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) return String(raw);
  return localKey(raw);
}

function DashboardPage() {
  const fund = useFund();
  const { lang, t } = useLang();
  const { settings, summary, myMember, transactions, withdrawals, weekContributions } = fund;
  const [now, setNow] = useState(null);

  useEffect(() => setNow(new Date()), []);

  const locale = lang === "en" ? "en-IN" : "ml-IN";
  const monday = startOfWeek(now || new Date(), settings?.week_start_day ?? 1);
  const sunday = addDays(monday, 6);
  const range = `${formatDate(monday, locale)} – ${formatDate(sunday, locale)}`;
  const paid = weekContributions.filter((c) => c.status === "paid");
  const firstName = (myMember?.full_name || "").split(" ")[0];
  const weekCollected = weekContributions.reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);

  // Contributions received on each day of this week (rejected ones excluded).
  const todayKey = localKey(now || new Date());
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const key = localKey(date);
    const value = transactions
      .filter((row) => row.category === "weekly_contribution" && row.status !== "rejected" && txnDayKey(row) === key)
      .reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    return {
      key,
      value,
      today: key === todayKey,
      label: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date),
      date: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(date),
    };
  });

  const pendingVerification = transactions.filter((row) => row.status === "pending").length;
  const pendingRequests = withdrawals.filter((w) => ["submitted", "under_review"].includes(w.status)).length;

  const activities = transactions.slice(0, 5).map((row) => {
    const label = ACTIVITY_LABEL[row.category];
    const status =
      row.status === "verified" ? t("പരിശോധിച്ചു", "Verified") : row.status === "pending" ? t("പരിശോധനയിൽ", "Pending") : t("നിരസിച്ചു", "Rejected");
    return {
      type: ACTIVITY_TYPE[row.category] || "request",
      title: `${row.member_name || "FUND"} – ${label ? t(label.ml, label.en) : t("മറ്റ് ഇടപാട്", "Other transaction")}`,
      meta: `${row.method === "cash" ? t("ക്യാഷ്", "Cash") : t("ഓൺലൈൻ", "Online")} · ${status}`,
      amount: Number(row.amount) || 0,
      when: formatDateTime(row.created_date || row.txn_date),
    };
  });

  const leadFont = lang === "en" ? "" : "font-mal";

  return (
    <div className="page-enter space-y-6">
      {/* Greeting */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[14.5px] text-foreground/80">{now ? formatDate(now, locale) : " "}</p>
          <h1 className={cn("mt-1 text-[1.9rem] font-bold leading-tight tracking-tight sm:text-[2.2rem]", leadFont)}>
            {t("നമസ്കാരം", "Welcome")}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className={cn("mt-1 text-[15px] text-muted-foreground", leadFont)}>
            {t("ഈ ആഴ്ചയിലെ ഫണ്ട് വിവരങ്ങൾ", "Here's your fund summary for this week")}
          </p>
        </div>
        <span className="card-soft inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-2.5 text-[14px] font-medium">
          <CalendarDays className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.8} />
          <span className="tnum">{range}</span>
        </span>
      </header>

      {/* Headline figures */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr]">
        <StatCard
         
          labelMl="ആകെ ഫണ്ട് ബാലൻസ്"
          labelEn="Total fund balance"
          value={summary.balance}
          className="md:col-span-2 xl:col-span-1"
          details={[
            { label: t("ക്യാഷ്", "Cash"), value: inr(summary.cashBalance) },
            { label: t("അംഗങ്ങൾ", "Members"), value: String(summary.members) },
          ]}
        />
        <StatCard labelMl="ആകെ സംഭാവന" labelEn="Total contributions" value={summary.contributionsTotal} />
        <StatCard labelMl="നൽകിയ വായ്പ" labelEn="Total money lent" value={summary.lent} />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard size="sm" labelMl="ബാക്കി തുക" labelEn="Total outstanding" value={summary.outstanding} />
        <StatCard size="sm" labelMl="ലഭിച്ച പലിശ" labelEn="Interest collected" value={summary.interestCollected} />
        <StatCard size="sm" labelMl="ഈ ആഴ്ചയിലെ ശേഖരണം" labelEn="Collected this week" value={weekCollected} />
        <StatCard size="sm" labelMl="ആകെ അംഗങ്ങൾ" labelEn="Total members" value={summary.members} prefix="" />
      </section>

      {/* Items needing a handler's attention */}
      {(pendingVerification > 0 || pendingRequests > 0) && (fund.isHandler || fund.isAdmin) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {pendingVerification > 0 && (
            <AttentionLink
              to="/transactions"
              icon={ClipboardCheck}
              title={t("പരിശോധിക്കാനുള്ള പേയ്‌മെന്റുകൾ", "Payments to verify")}
              detail={`${pendingVerification} ${t("പരിശോധനയിൽ", "pending verification")}`}
              font={leadFont}
              tone="amber"
            />
          )}
          {pendingRequests > 0 && (
            <AttentionLink
              to="/request-fund"
              icon={HandCoins}
              title={t("അനുമതിക്കായുള്ള ഫണ്ട് അഭ്യർത്ഥനകൾ", "Fund requests awaiting approval")}
              detail={`${pendingRequests} ${t("തീരുമാനത്തിനായി കാത്തിരിക്കുന്നു", "awaiting decision")}`}
              font={leadFont}
              tone="blue"
            />
          )}
        </section>
      )}

      {/* This week + quick actions */}
      <section className="grid items-stretch gap-4 xl:grid-cols-[1.75fr_1fr]">
        {weekContributions.length === 0 ? (
          <div className="card-soft h-full rounded-2xl border border-border bg-card p-6">
            <EmptyState
              icon={HandCoins}
              ml="ഈ ആഴ്ചയുടെ സംഭാവന രേഖകൾ ഇല്ല"
              en="This week's contributions are not generated yet"
              action={
                <Link to="/contributions" className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground">
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
              collected: weekCollected,
              range,
              days,
            }}
          />
        )}
        <QuickActions />
      </section>

      {/* Recent activity + trust note */}
      <section className="grid items-stretch gap-4 xl:grid-cols-[1.75fr_1fr]">
        {activities.length === 0 ? (
          <div className="card-soft rounded-2xl border border-border bg-card p-6">
            <EmptyState
              icon={Siren}
              ml="ഇടപാടുകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല"
              en="No transactions recorded yet"
              action={
                <Link to="/contributions" className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground">
                  {t("ആദ്യ സംഭാവന രേഖപ്പെടുത്തുക", "Record the first contribution")}
                </Link>
              }
            />
          </div>
        ) : (
          <ActivityFeed items={activities} />
        )}

        <article className="card-soft relative flex flex-col justify-center overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent to-card p-7">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <ShieldCheck className="h-8 w-8" strokeWidth={1.8} />
          </span>
          <h2 className={cn("mt-5 text-[18px] font-semibold", leadFont)}>{t("നിങ്ങളുടെ ഫണ്ട് സുരക്ഷിതമാണ്", "Your fund is secure")}</h2>
          <p className={cn("mt-1.5 text-[14.5px] text-muted-foreground", leadFont)}>
            {t(
              "എല്ലാ ഇടപാടുകളും പരിശോധിച്ച് സ്ഥിരമായി രേഖപ്പെടുത്തുന്നു.",
              "Every transaction is verified and permanently recorded."
            )}
          </p>
          <Link
            to="/rules"
            className={cn(
              "mt-5 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90",
              leadFont
            )}
          >
            {t("ഫണ്ട് നിയമങ്ങൾ കാണുക", "View fund rules")}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-primary/[0.06]" />
        </article>
      </section>
    </div>
  );
}

function AttentionLink({ to, icon: Icon, title, detail, font, tone }) {
  const tones = {
    amber: { box: "border-amber-200 bg-amber-50/70 hover:border-amber-300", chip: "bg-amber-100 text-amber-700" },
    blue: { box: "border-border bg-card hover:border-primary/40", chip: "bg-accent text-primary" },
  };
  const style = tones[tone] || tones.blue;
  return (
    <Link to={to} className={cn("card-soft flex items-center gap-4 rounded-2xl border px-5 py-4 transition-colors", style.box)}>
      <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", style.chip)}>
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-[15px] font-medium", font)}>{title}</span>
        <span className={cn("block text-[13px] text-muted-foreground", font)}>{detail}</span>
      </span>
      <ArrowUpRight className="h-5 w-5 text-muted-foreground" strokeWidth={1.8} />
    </Link>
  );
}
