import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { BellRing, ChevronLeft, ChevronRight, RefreshCw, Wallet } from "lucide-react";
import PageHeader from "@/components/fund/PageHeader";
import SectionHeading from "@/components/fund/SectionHeading";
import StatusPill from "@/components/fund/StatusPill";
import EmptyState from "@/components/fund/EmptyState";
import PayDialog from "@/components/contributions/PayDialog";
import PendingPayments from "@/components/contributions/PendingPayments";
import { useFund } from "@/lib/FundContext";
import { useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";
import { addDays, formatDate, inr, isoDate } from "@/lib/format";
import { lateInterest } from "@/lib/finance";
import { generateWeek, sendContributionReminders } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/contributions")({
  component: ContributionsPage,
});

function ContributionsPage() {
  const fund = useFund();
  const { lang, t } = useLang();
  const { contributions, settings, myMember, isHandler, transactions, members } = fund;
  const [weekStart, setWeekStart] = useState(fund.weekStart);
  const [payTarget, setPayTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(
    () => contributions.filter((c) => c.week_start === weekStart).sort((a, b) => (a.member_name || "").localeCompare(b.member_name || "")),
    [contributions, weekStart]
  );

  const pendingOnline = transactions.filter((t) => t.status === "pending" && t.category === "weekly_contribution");
  const myHistory = contributions
    .filter((c) => c.member_email === myMember?.user_email)
    .slice()
    .sort((a, b) => (a.week_start < b.week_start ? 1 : -1));

  const paidCount = rows.filter((r) => r.status === "paid").length;
  const totalDue = rows.reduce((sum, r) => sum + (Number(r.amount_due) - Number(r.amount_paid || 0)), 0);

  const shift = (days) => setWeekStart(isoDate(addDays(weekStart, days)));

  const generate = async () => {
    setBusy(true);
    try {
      const result = await generateWeek({ data: { week_start: weekStart } });
      toast.success(
        result.created
          ? t(`${result.created} അംഗങ്ങൾക്ക് രേഖ സൃഷ്ടിച്ചു`, `Created records for ${result.created} members`)
          : t("ഈ ആഴ്ചയുടെ രേഖകൾ ഇതിനകം ഉണ്ട്", "This week's records already exist")
      );
      fund.reload();
    } catch (error) {
      toast.error(error?.message || t("രേഖകൾ സൃഷ്ടിക്കാനായില്ല", "Could not generate records"));
    } finally {
      setBusy(false);
    }
  };

  const remind = async () => {
    setBusy(true);
    try {
      const result = await sendContributionReminders({ data: { week_start: weekStart } });
      toast.success(t(`${result.sent} അംഗങ്ങൾക്ക് ഓർമ്മപ്പെടുത്തൽ അയച്ചു`, `Reminders sent to ${result.sent} members`));
    } catch (error) {
      toast.error(error?.message || t("ഓർമ്മപ്പെടുത്തൽ അയക്കാനായില്ല", "Could not send reminders"));
    } finally {
      setBusy(false);
    }
  };

  const statusFor = (row) => {
    if (row.status === "paid") return "paid";
    if (row.due_date && new Date(row.due_date) < new Date()) return "overdue";
    return row.status === "partial" ? "partial" : "pending";
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        ml="ആഴ്ച സംഭാവനകൾ"
        en="Weekly contributions"
        description={t(
          `ഓരോ അംഗവും ആഴ്ചയിൽ ${inr(settings?.weekly_amount || 250)} അടയ്ക്കണം. അടച്ചതും ബാക്കിയുള്ളതും ഇവിടെ കാണാം.`,
          `Each member must contribute ${inr(settings?.weekly_amount || 250)} per week. View paid and outstanding contributions here.`
        )}
        action={
          isHandler ? (

            <div className="flex flex-wrap gap-2">
              <button
                onClick={generate}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground disabled:opacity-60"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("ഈ ആഴ്ച സൃഷ്ടിക്കുക", "Generate this week")}
              </button>
              <button
                onClick={remind}
                disabled={busy || !rows.length}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-[13px] text-foreground/80 disabled:opacity-60"
              >
                <BellRing className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("ഓർമ്മപ്പെടുത്തൽ", "Remind")}
              </button>
            </div>
          ) : null
        }
      />

      <section className="rounded-[1.4rem] border border-border bg-card p-4 sm:p-5">

        <div className="flex items-center justify-between gap-3">
          <button onClick={() => shift(-7)} className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="font-mal text-[14.5px]">
              {formatDate(weekStart)} – {formatDate(isoDate(addDays(weekStart, 6)))}
            </p>
            <p className={cn("mt-0.5 text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground", lang === "en" ? "font-mal" : "")}>
              {t("സംഭാവന ആഴ്ച", "Contribution week")}
            </p>
          </div>
          <button onClick={() => shift(7)} className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/70 pt-4">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">{t("അടച്ചത്", "Paid")}</p>
            <p className="tnum mt-1 font-display text-[1.1rem]">
              {paidCount}/{rows.length || members.filter((m) => m.status === "active").length}
            </p>
          </div>
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">{t("ബാക്കി", "Pending")}</p>
            <p className="tnum mt-1 font-display text-[1.1rem]">{rows.length - paidCount}</p>
          </div>
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">{t("ശേഖരിക്കാനുള്ളത്", "To collect")}</p>
            <p className="tnum mt-1 font-display text-[1.1rem]">{inr(totalDue)}</p>
          </div>
        </div>
      </section>

        <section>
          <SectionHeading ml="ഈ ആഴ്ചയിലെ അംഗങ്ങൾ" en="Member status" />
          {rows.length === 0 ? (
            <EmptyState
              icon={Wallet}
              ml="ഈ ആഴ്ചയുടെ രേഖകൾ ഇല്ല"
              en="No contributions generated for this week"
              action={
                isHandler ? (
                  <button onClick={generate} disabled={busy} className="rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground">
                    {t("രേഖകൾ സൃഷ്ടിക്കുക", "Generate records")}
                  </button>
                ) : (
                  <p className="font-mal text-[13px] text-muted-foreground">{t("ക്യാഷ് ഹാൻഡ്ലർ രേഖകൾ സൃഷ്ടിക്കും", "The cash handler will generate the records")}</p>
                )
              }
            />
          ) : (
            <div className="overflow-hidden rounded-[1.2rem] border border-border bg-card">
              {rows.map((row, index) => {
                const status = statusFor(row);
                const late = lateInterest({ ...row, status }, settings);
                const isMine = row.member_email === myMember?.user_email;
                return (
                  <div
                    key={row.id}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3 ${index ? "border-t border-border/70" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mal text-[14px] leading-tight">
                        {row.member_name}
                        {isMine && (
                          <span className="ml-2 text-[11.5px] uppercase tracking-[0.12em] text-primary">{t("നിങ്ങൾ", "you")}</span>
                        )}
                      </p>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {inr(row.amount_paid || 0)} / {inr(row.amount_due)}
                        {row.paid_date ? ` · ${formatDate(row.paid_date)}` : ""}
                        {late.interest > 0 ? ` · ${t("പലിശ", "Interest")} ${inr(late.interest)}` : ""}
                      </p>
                    </div>
                    <StatusPill tone={status}>
                      {status === "paid"
                        ? t("അടച്ചു", "Paid")
                        : status === "overdue"
                          ? t("കാലതാമസം", "Overdue")
                          : status === "partial"
                            ? t("ഭാഗികം", "Partial")
                            : t("ബാക്കി", "Pending")}
                    </StatusPill>
                    {status !== "paid" && (isMine || isHandler) && (
                      <button
                        onClick={() => setPayTarget(row)}
                        className="rounded-full bg-primary/10 px-3 py-1.5 text-[12.5px] text-primary"
                      >
                        {isMine ? t("അടയ്ക്കുക", "Pay") : t("ക്യാഷ് രേഖപ്പെടുത്തുക", "Record cash")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {isHandler && pendingOnline.length > 0 && (
          <section>
            <SectionHeading ml="പരിശോധനയ്ക്കായി കാത്തിരിക്കുന്നു" en="Awaiting verification" />
            <PendingPayments items={pendingOnline} onDone={() => fund.reload()} />
          </section>
        )}

        <section>
          <SectionHeading ml="എന്റെ സംഭാവന ചരിത്രം" en="My contribution history" />
          {myHistory.length === 0 ? (
            <EmptyState icon={Wallet} ml="ഇതുവരെ സംഭാവന രേഖകൾ ഇല്ല" en="No contribution records yet" />
          ) : (
            <div className="overflow-hidden rounded-[1.2rem] border border-border bg-card">
              {myHistory.slice(0, 12).map((row, index) => (
                <div key={row.id} className={`flex items-center justify-between gap-3 px-4 py-3 ${index ? "border-t border-border/70" : ""}`}>
                  <div>
                    <p className="text-[13.5px]">{formatDate(row.week_start)}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {row.method === "cash" ? t("ക്യാഷ്", "Cash") : row.method === "online" ? t("ഓൺലൈൻ", "Online") : "—"}
                    </p>
                  </div>
                  <p className="tnum text-[14px]">{inr(row.amount_paid || 0)}</p>
                  <StatusPill tone={row.status === "paid" ? "paid" : row.status === "partial" ? "partial" : "pending"}>
                    {row.status === "paid"
                      ? t("അടച്ചു", "Paid")
                      : row.status === "partial"
                        ? t("ഭാഗികം", "Partial")
                        : t("ബാക്കി", "Pending")}
                  </StatusPill>
                </div>
              ))}
            </div>
          )}
        </section>

        {payTarget && (
          <PayDialog
            contribution={payTarget}
            allowCash={isHandler}
            open={!!payTarget}
            onOpenChange={(next) => !next && setPayTarget(null)}
            onDone={() => fund.reload()}
          />
        )}
    </div>
  );
}