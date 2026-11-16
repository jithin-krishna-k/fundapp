import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Banknote, Check, Clock, Send, Undo2, Wallet } from "lucide-react";
import PageHeader from "@/components/fund/PageHeader";
import SectionHeading from "@/components/fund/SectionHeading";
import StatusPill from "@/components/fund/StatusPill";
import EmptyState from "@/components/fund/EmptyState";
import NewRequestDialog from "@/components/withdrawals/NewRequestDialog";
import RepayDialog from "@/components/withdrawals/RepayDialog";
import { useFund } from "@/lib/FundContext";
import { formatDate, inr } from "@/lib/format";
import { borrowingInterest, loanSummary } from "@/lib/finance";
import { decideWithdrawal } from "@/lib/server-fns";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed/request-fund")({
  component: RequestFundPage,
});

const STATUS_TONE = {
  submitted: "pending",
  under_review: "partial",
  approved: "accent",
  rejected: "overdue",
  disbursed: "neutral",
  repaid: "paid",
};

const STATUS_LABEL = {
  submitted: { ml: "സമർപ്പിച്ചു", en: "Submitted" },
  under_review: { ml: "പരിശോധനയിൽ", en: "Under review" },
  approved: { ml: "അനുമതി", en: "Approved" },
  rejected: { ml: "നിരസിച്ചു", en: "Rejected" },
  disbursed: { ml: "നൽകി", en: "Disbursed" },
  repaid: { ml: "തിരിച്ചടച്ചു", en: "Repaid" },
};

function RequestFundPage() {
  const { t } = useLang();
  const fund = useFund();
  const { withdrawals, settings, summary, myMember, isAdmin, isHandler, members } = fund;
  const [open, setOpen] = useState(false);
  const [repay, setRepay] = useState(null);
  const [busy, setBusy] = useState(null);

  const openLoans = withdrawals.filter((w) => ["approved", "disbursed"].includes(w.status));
  const awaiting = withdrawals.filter((w) => ["submitted", "under_review"].includes(w.status));

  const outstandingFor = (email) =>
    withdrawals
      .filter((w) => w.member_email === email && ["approved", "disbursed"].includes(w.status))
      .reduce((sum, w) => sum + loanSummary(w, settings).remaining, 0);

  const act = async (id, action) => {
    setBusy(id + action);
    try {
      await decideWithdrawal({ data: { id, action } });
      toast.success(action === "disburse" ? "തുക നൽകി രേഖപ്പെടുത്തി" : action === "approve" ? "അനുമതി നൽകി" : action === "reject" ? "നിരസിച്ചു" : "പരിശോധനയിലേക്ക് മാറ്റി");
      fund.reload();
    } catch (error) {
      toast.error(error?.message || "നടപടി പരാജയപ്പെട്ടു");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        ml="ഫണ്ട് അഭ്യർത്ഥന"
        en="Request fund · borrowing"
        description={t(
          "ഗ്രൂപ്പ് ഫണ്ടിൽ നിന്ന് വായ്പ ആവശ്യപ്പെടാം. സൂപ്പർ അഡ്മിൻ പരിശോധിച്ച് അനുമതി നൽകും.",
          "Request a loan from the group fund. The super admin reviews and approves it."
        )}
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[11.5px] text-primary-foreground"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("പുതിയ അഭ്യർത്ഥന", "New request")}
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.2rem] border border-border bg-card px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Available balance</p>
          <p className="tnum mt-1 font-display text-[1.3rem] leading-none">{inr(summary.balance)}</p>
        </div>
        <div className="rounded-[1.2rem] border border-border bg-card px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Open loans</p>
          <p className="tnum mt-1 font-display text-[1.3rem] leading-none">{openLoans.length}</p>
        </div>
        <div className="rounded-[1.2rem] border border-border bg-card px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">My outstanding</p>
          <p className="tnum mt-1 font-display text-[1.3rem] leading-none">{inr(outstandingFor(myMember?.user_email))}</p>
        </div>
      </div>

      <section className="rounded-[1.2rem] border border-dashed border-primary/25 bg-primary/[0.04] px-4 py-3">
        <p className="font-mal text-[11.5px] leading-relaxed text-primary/90">
          {t("പലിശ നിയമം", "Interest rule")}:{" "}
          {settings?.borrowing_interest_mode === "weekly"
            ? t(`ആഴ്ചയിൽ ${settings?.borrowing_interest_percent}% വീതം`, `${settings?.borrowing_interest_percent}% per week`)
            : t(`ഒരു തവണ ${settings?.borrowing_interest_percent}%`, `${settings?.borrowing_interest_percent}% once`)}{" "}
          — {t("അതേ ആഴ്ചയിൽ തിരിച്ചടച്ചാൽ പലിശയില്ല.", "no interest if repaid in the same week.")}
        </p>
      </section>

      {isAdmin && awaiting.length > 0 && (
        <section>
          <SectionHeading ml="അനുമതിക്കായി കാത്തിരിക്കുന്നു" en="Awaiting your decision" />
          <div className="space-y-3">
            {awaiting.map((w) => {
              const memberOutstanding = outstandingFor(w.member_email);
              const repaidCount = withdrawals.filter((x) => x.member_email === w.member_email && x.status === "repaid").length;
              return (
                <article key={w.id} className="rounded-[1.3rem] border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mal text-[13.5px]">{w.member_name}</p>
                      <p className="mt-1 font-mal text-[11.5px] text-muted-foreground">{w.purpose}</p>
                    </div>
                    <p className="tnum font-display text-[1.25rem] leading-none">{inr(w.amount)}</p>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-3 sm:grid-cols-4">
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Fund balance</dt>
                      <dd className="tnum mt-0.5 text-[12px]">{inr(summary.balance)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Their loans</dt>
                      <dd className="tnum mt-0.5 text-[12px]">{inr(memberOutstanding)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Repaid before</dt>
                      <dd className="tnum mt-0.5 text-[12px]">{repaidCount}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Repay by</dt>
                      <dd className="mt-0.5 text-[12px]">{formatDate(w.expected_repayment_date)}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => act(w.id, "approve")}
                      disabled={busy === w.id + "approve" || Number(w.amount) > summary.balance}
                      className="flex items-center gap-1 rounded-full bg-emerald-600/12 px-3 py-1.5 text-[11px] text-emerald-800 disabled:opacity-40"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2} /> {t("അനുമതി", "Approve")}
                    </button>
                    <button
                      onClick={() => act(w.id, "review")}
                      disabled={busy === w.id + "review"}
                      className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground"
                    >
                      <Clock className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("പരിശോധനയിൽ", "Review")}
                    </button>
                    <button
                      onClick={() => act(w.id, "reject")}
                      disabled={busy === w.id + "reject"}
                      className="flex items-center gap-1 rounded-full bg-red-600/10 px-3 py-1.5 text-[11px] text-red-800"
                    >
                      <Undo2 className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("നിരസിക്കുക", "Reject")}
                    </button>
                    {Number(w.amount) > summary.balance && (
                      <span className="self-center font-mal text-[10.5px] text-red-700">
                        {t("ബാലൻസ് മതിയാകില്ല", "Not enough balance")}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionHeading ml="വായ്പകൾ" en="Loans & requests" />
        {withdrawals.length === 0 ? (
          <EmptyState
            icon={Banknote}
            ml="ഇതുവരെ ഫണ്ട് അഭ്യർത്ഥനകൾ ഇല്ല"
            en="No fund requests yet"
            action={
              <button onClick={() => setOpen(true)} className="rounded-full bg-primary px-4 py-2 text-[11.5px] text-primary-foreground">
                {t("ആദ്യ അഭ്യർത്ഥന സമർപ്പിക്കുക", "Submit the first request")}
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const schedule = loanSummary(w, settings);
              const { chargeableWeeks } = borrowingInterest(w, settings);
              return (
                <article key={w.id} className="rounded-[1.3rem] border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mal text-[13px]">{w.member_name}</p>
                      <p className="mt-1 font-mal text-[11.5px] text-muted-foreground">
                        {w.purpose} · {formatDate(w.request_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={STATUS_TONE[w.status]}>
                        {t(STATUS_LABEL[w.status].ml, STATUS_LABEL[w.status].en)}
                      </StatusPill>
                      <p className="tnum font-display text-[1.15rem] leading-none">{inr(w.amount)}</p>
                    </div>
                  </div>

                  {["approved", "disbursed", "repaid"].includes(w.status) && (
                    <>
                      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-border/70 pt-3 sm:grid-cols-4">
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Principal</dt>
                          <dd className="tnum mt-0.5 text-[12px]">{inr(schedule.principal)}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                            Interest · {schedule.percent}%{schedule.mode === "weekly" ? `/wk · ${chargeableWeeks}w` : " once"}
                          </dt>
                          <dd className="tnum mt-0.5 text-[12px]">{inr(schedule.interest)}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Total paid</dt>
                          <dd className="tnum mt-0.5 text-[12px]">{inr(schedule.paid)}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Remaining</dt>
                          <dd className="tnum mt-0.5 text-[12px]">{inr(schedule.remaining)}</dd>
                        </div>
                      </dl>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {isAdmin && w.status === "approved" && (
                          <button
                            onClick={() => act(w.id, "disburse")}
                            disabled={busy === w.id + "disburse"}
                            className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] text-primary-foreground"
                          >
                            <Wallet className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("തുക നൽകുക", "Disburse")}
                          </button>
                        )}
                        {isHandler && w.status !== "repaid" && (
                          <button
                            onClick={() => setRepay(w)}
                            className="rounded-full border border-border px-3 py-1.5 text-[11px] text-foreground/80"
                          >
                            {t("തിരിച്ചടവ് രേഖപ്പെടുത്തുക", "Record repayment")}
                          </button>
                        )}
                        {w.status === "repaid" && (
                          <span className="font-mal text-[10.5px] text-emerald-700">
                            {t("തീർത്തു", "Settled")} · {formatDate(w.repaid_date)}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <NewRequestDialog
        open={open}
        onOpenChange={setOpen}
        availableBalance={summary.balance}
        onDone={() => fund.reload()}
      />

      {repay && (
        <RepayDialog
          loan={repay}
          remaining={loanSummary(repay, settings).remaining}
          open={!!repay}
          onOpenChange={(next) => !next && setRepay(null)}
          onDone={() => fund.reload()}
        />
      )}
    </div>
  );
}