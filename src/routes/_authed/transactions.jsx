import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Download, ExternalLink, ReceiptText, X } from "lucide-react";
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

      <div className="flex flex-wrap gap-2">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-full border border-border bg-card px-3 py-2 font-mal text-[13px] text-foreground/80"
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
          className="rounded-full border border-border bg-card px-3 py-2 font-mal text-[13px] text-foreground/80"
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
            <div key={t.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${index ? "border-t border-border/70" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="font-mal text-[14px] leading-tight">
                  {CATEGORY[t.category] ? tr(CATEGORY[t.category].ml, CATEGORY[t.category].en) : t.category} ·{" "}
                  {t.member_name || tr("ഫണ്ട്", "Fund")}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {t.ref} · {formatDate(t.txn_date || t.created_date)} ·{" "}
                  {t.method === "cash" ? tr("ക്യാഷ്", "Cash") : tr("ഓൺലൈൻ", "Online")}
                  {t.recorded_by ? ` · ${t.recorded_by}` : ""}
                </p>
              </div>
              <p className={`tnum text-[14px] font-medium ${t.direction === "out" ? "text-red-700" : "text-emerald-800"}`}>
                {t.direction === "out" ? "−" : "+"}
                {inr(t.amount)}
              </p>
              <StatusPill tone={statusTone[t.status]}>
                {tr(statusLabel[t.status].ml, statusLabel[t.status].en)}
              </StatusPill>
              {t.screenshot_url && (
                <button
                  onClick={() => openPrivate(t.screenshot_url)}
                  className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground"
                  aria-label="Screenshot"
                >
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.7} />
                </button>
              )}
              {isHandler && t.status === "pending" && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => verify(t.id, "verify")}
                    disabled={busy === t.id + "verify"}
                    className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600/12 text-emerald-800"
                    aria-label="Verify"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => verify(t.id, "reject")}
                    disabled={busy === t.id + "reject"}
                    className="grid h-7 w-7 place-items-center rounded-full bg-red-600/10 text-red-800"
                    aria-label="Reject"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
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