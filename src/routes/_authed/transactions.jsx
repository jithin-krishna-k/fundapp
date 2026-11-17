import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, CheckCircle2, Clock3, Download, ExternalLink, ReceiptText, X, XCircle } from "lucide-react";

// Status is shown with an icon as well as colour, so it reads at a glance (and without colour).
const STATUS_ICON = { verified: CheckCircle2, pending: Clock3, rejected: XCircle };
import PageHeader from "@/components/fund/PageHeader";
import StatusPill from "@/components/fund/StatusPill";
import EmptyState from "@/components/fund/EmptyState";
import { useFund } from "@/lib/FundContext";
import { CATEGORY } from "@/lib/finance";
import { downloadCsv, openPrivate } from "@/lib/uploads";
import { formatDate, inr } from "@/lib/format";
import { reviewTransaction } from "@/lib/server-fns";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed/transactions")({
  component: TransactionsPage,
});

const statusTone = { verified: "paid", pending: "pending", rejected: "overdue" };
const statusLabel = {
  verified: { ml: "സ്ഥിരീകരിച്ചു", en: "Verified" },
  pending: { ml: "പരിശോധനയിൽ", en: "Pending" },
  rejected: { ml: "നിരസിച്ചു", en: "Rejected" },
};

function TransactionsPage() {
  const { t: tr } = useLang();
  const fund = useFund();
  const { transactions, isHandler } = fund;
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState(null);

  const rows = transactions.filter(
    (t) => (category === "all" || t.category === category) && (status === "all" || t.status === status)
  );

  const verify = async (id, action) => {
    setBusy(id + action);
    try {
      await reviewTransaction({ data: { id, action, reason: action === "reject" ? tr("കാരണം നൽകിയില്ല", "No reason provided") : undefined } });
      toast.success(action === "verify" ? tr("പരിശോധിച്ചു", "Verified") : tr("നിരസിച്ചു", "Rejected"));
      fund.reload();
    } catch (error) {
      const msg = String(error?.message || "");
      if (error?.status === 400 || /already handled/i.test(msg)) {
        toast.info(tr("ഈ എൻട്രി ഇതിനകം പരിഗണിച്ചു", "This entry is already handled"));
        fund.reload();
      } else {
        toast.error(msg || tr("പ്രവർത്തനം പരാജയപ്പെട്ടു", "Action failed"));
      }
    } finally {
      setBusy(null);
    }
  };

  const exportCsv = () => {
    downloadCsv(
      `fund-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Ref", "Date", "Member", "Category", "Amount", "Direction", "Method", "Status", "Recorded by", "Verified by"],
      rows.map((t) => [
        t.ref,
        t.txn_date,
        t.member_name || "",
        CATEGORY[t.category]?.en || t.category,
        t.amount,
        t.direction,
        t.method,
        t.status,
        t.recorded_by || "",
        t.verified_by || "",
      ])
    );
  };

  return (
    <div className="page-enter space-y-5">
      <PageHeader
        ml="ഇടപാടുകൾ"
        en="Transactions ledger"
        description={tr(
          "എല്ലാ സാമ്പത്തിക ഇടപാടുകളുടെയും സ്ഥിരമായ രേഖ. സ്ഥിരീകരിച്ച ഇടപാടുകൾ മാറ്റാൻ കഴിയില്ല.",
          "A permanent record of every financial transaction. Verified transactions cannot be changed."
        )}
        action={
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-[13px] text-foreground/80"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} /> CSV
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-10 w-full min-w-0 rounded-full border border-border bg-card px-3 font-mal text-[13px] text-foreground/80 sm:w-auto"
        >
          <option value="all">{tr("എല്ലാ വിഭാഗങ്ങളും", "All categories")}</option>
          {Object.entries(CATEGORY).map(([key, value]) => (
            <option key={key} value={key}>
              {tr(value.ml, value.en)}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 w-full min-w-0 rounded-full border border-border bg-card px-3 font-mal text-[13px] text-foreground/80 sm:w-auto"
        >
          <option value="all">{tr("എല്ലാ നിലകളും", "All statuses")}</option>
          <option value="verified">{tr("സ്ഥിരീകരിച്ചു", "Verified")}</option>
          <option value="pending">{tr("പരിശോധനയിൽ", "Pending")}</option>
          <option value="rejected">{tr("നിരസിച്ചു", "Rejected")}</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={ReceiptText} ml="ഇടപാടുകൾ ഒന്നുമില്ല" en="No transactions match this filter" />
      ) : (
        <div className="overflow-hidden rounded-[1.2rem] border border-border bg-card">
          {rows.map((t, index) => (
            <div key={t.id} className={`px-4 py-4 ${index ? "border-t border-border/70" : ""}`}>
              {/* 1 · How much (focal point) and whether it's verified. */}
              <div className="flex items-start justify-between gap-3">
                <p className={`tnum text-[24px] font-bold leading-none tracking-tight ${t.direction === "out" ? "text-red-700" : "text-emerald-700"}`}>
                  {t.direction === "out" ? "−" : "+"}
                  {inr(t.amount)}
                </p>
                <StatusPill tone={statusTone[t.status]}>
                  <span className="inline-flex items-center gap-1">
                    {(() => {
                      const Icon = STATUS_ICON[t.status];
                      return Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /> : null;
                    })()}
                    {tr(statusLabel[t.status].ml, statusLabel[t.status].en)}
                  </span>
                </StatusPill>
              </div>

              {/* 2 · Who paid, and for what. */}
              <p className="mt-2 truncate text-[15px] font-medium leading-snug text-foreground">
                {t.member_name || tr("ഫണ്ട്", "Fund")}
              </p>
              <p className="font-mal text-[13px] text-muted-foreground">
                {CATEGORY[t.category] ? tr(CATEGORY[t.category].ml, CATEGORY[t.category].en) : t.category}
              </p>

              {/* 3 · Proof and reference: quiet footer. */}
              <div className="mt-3 flex items-end justify-between gap-3 border-t border-dashed border-border/80 pt-2.5">
                <p className="min-w-0 text-[11.5px] leading-relaxed text-muted-foreground">
                  {formatDate(t.txn_date || t.created_date)} · {t.method === "cash" ? tr("ക്യാഷ്", "Cash") : tr("ഓൺലൈൻ", "Online")}
                  {t.recorded_by ? <> · {tr("രേഖപ്പെടുത്തിയത്", "By")} {t.recorded_by}</> : null}
                  <span className="block tracking-wide text-muted-foreground/80">{t.ref}</span>
                </p>
                {t.screenshot_url && (
                  <button
                    onClick={() => openPrivate(t.screenshot_url)}
                    className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-border px-3 text-[12px] text-foreground/70"
                  >
                    <ExternalLink className="h-3 w-3" strokeWidth={1.8} /> {tr("തെളിവ്", "Proof")}
                  </button>
                )}
              </div>

              {/* Handler actions for unverified entries. */}
              {isHandler && t.status === "pending" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => verify(t.id, "verify")}
                    disabled={busy === t.id + "verify"}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-emerald-600 text-[13.5px] font-medium text-white disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" strokeWidth={2.2} /> {tr("സ്ഥിരീകരിക്കുക", "Verify")}
                  </button>
                  <button
                    onClick={() => verify(t.id, "reject")}
                    disabled={busy === t.id + "reject"}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-full border border-red-600/30 text-[13.5px] font-medium text-red-700 disabled:opacity-60"
                  >
                    <X className="h-4 w-4" strokeWidth={2.2} /> {tr("നിരസിക്കുക", "Reject")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}