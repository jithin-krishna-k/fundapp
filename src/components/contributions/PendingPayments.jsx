import { useState } from "react";
import { toast } from "sonner";
import { Check, ExternalLink, X } from "lucide-react";
import { reviewTransaction } from "@/lib/server-fns";
import { openPrivate } from "@/lib/uploads";
import { inr, formatDateTime } from "@/lib/format";
import { useLang } from "@/lib/LangContext";

export default function PendingPayments({ items, onDone }) {
  const { t } = useLang();
  const [busyId, setBusyId] = useState(null);

  const act = async (id, action) => {
    setBusyId(id);
    try {
      const reason = action === "reject" ? t("സ്ക്രീൻഷോട്ടിൽ നിന്ന് സ്ഥിരീകരിക്കാനായില്ല", "Could not verify from the screenshot") : undefined;
      await reviewTransaction({ data: { id, action, reason } });
      toast.success(action === "verify" ? t("പേയ്‌മെന്റ് സ്ഥിരീകരിച്ചു", "Payment verified") : t("നിരസിച്ചു", "Rejected"));
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("പ്രവർത്തനം പരാജയപ്പെട്ടു", "Action failed"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-2">
      {items.map((txn) => (
        <div key={txn.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="font-mal break-words text-[14px] leading-tight">
              {txn.member_name} · {inr(txn.amount)}
            </p>
            <p className="mt-1 break-words text-[12px] text-muted-foreground">
              {txn.ref} · {formatDateTime(txn.created_date)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {txn.screenshot_url && (
              <button
                onClick={() => openPrivate(txn.screenshot_url)}
                className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1.5 text-[12.5px] text-muted-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.7} /> {t("സ്ക്രീൻഷോട്ട്", "Screenshot")}
              </button>
            )}
            <button
              onClick={() => act(txn.id, "verify")}
              disabled={busyId === txn.id}
              className="flex items-center gap-1 rounded-full bg-emerald-600/12 px-2.5 py-1.5 text-[12.5px] text-emerald-800"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2} /> {t("സ്ഥിരീകരിക്കുക", "Verify")}
            </button>
            <button
              onClick={() => act(txn.id, "reject")}
              disabled={busyId === txn.id}
              className="flex items-center gap-1 rounded-full bg-red-600/10 px-2.5 py-1.5 text-[12.5px] text-red-800"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} /> {t("നിരസിക്കുക", "Reject")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
