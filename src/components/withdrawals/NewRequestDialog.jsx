import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Field from "@/components/fund/Field";
import { createWithdrawal } from "@/lib/server-fns";
import { inr, isoDate, addDays } from "@/lib/format";
import { useLang } from "@/lib/LangContext";

export default function NewRequestDialog({ open, onOpenChange, availableBalance, onDone }) {
  const { lang, t } = useLang();
  const [form, setForm] = useState({
    amount: "",
    purpose: "",
    expected_repayment_date: isoDate(addDays(new Date(), 14)),
    explanation: "",
  });
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error(t("തുക നൽകുക", "Enter an amount"));
    if (!form.purpose.trim()) return toast.error(t("ഉദ്ദേശം നൽകുക", "Enter the purpose"));
    setBusy(true);
    try {
      await createWithdrawal({
        data: {
          amount,
          purpose: form.purpose,
          request_date: isoDate(new Date()),
          expected_repayment_date: form.expected_repayment_date,
          explanation: form.explanation || undefined,
        },
      });
      toast.success(t("അഭ്യർത്ഥന സമർപ്പിച്ചു", "Request submitted"));
      onOpenChange(false);
      setForm({ amount: "", purpose: "", expected_repayment_date: isoDate(addDays(new Date(), 14)), explanation: "" });
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("സമർപ്പിക്കാനായില്ല", "Could not submit"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[1.4rem] border-border bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={lang === "en" ? "font-normal" : "font-mal text-[1.05rem] font-normal"}>
            {t("ഫണ്ട് അഭ്യർത്ഥന", "Fund request")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <span className={lang === "en" ? "text-[13px] text-muted-foreground" : "font-mal text-[13px] text-muted-foreground"}>
              {t("ലഭ്യമായ ബാലൻസ്", "Available balance")}
            </span>
            <span className="tnum text-[14.5px] font-medium">{inr(availableBalance)}</span>
          </div>

          <Field label={t("ആവശ്യമായ തുക (₹)", "Amount needed (₹)")}>
            <Input type="number" min="1" value={form.amount} onChange={set("amount")} placeholder="10000" />
          </Field>
          <Field label={t("ഉദ്ദേശം", "Purpose")}>
            <Input value={form.purpose} onChange={set("purpose")} placeholder={t("ഉദാ: വീട്ടിലെ അറ്റകുറ്റപ്പണി", "e.g. home repairs")} />
          </Field>
          <Field label={t("തിരിച്ചടയ്ക്കാൻ ഉദ്ദേശിക്കുന്ന തീയതി", "Expected repayment date")}>
            <Input type="date" value={form.expected_repayment_date} onChange={set("expected_repayment_date")} />
          </Field>
          <Field label={t("കൂടുതൽ വിവരങ്ങൾ", "More details")} hint={t("ഓപ്ഷണൽ", "Optional")}>
            <Textarea rows={3} value={form.explanation} onChange={set("explanation")} />
          </Field>

          <p className={lang === "en" ? "px-3 py-2.5 text-[12.5px] leading-relaxed text-primary/90" : "px-3 py-2.5 font-mal text-[12.5px] leading-relaxed text-primary/90"}>
            {t(
              "നിയമം 5 — അതേ ആഴ്ചയിൽ തിരിച്ചടച്ചാൽ പലിശയില്ല. രണ്ടാമത്തെ ആഴ്ച മുതൽ പലിശ ബാധകമാകും.",
              "Rule 5 — no interest if repaid in the same week. Interest applies from the second week."
            )}
          </p>

          <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("അഭ്യർത്ഥന സമർപ്പിക്കുക", "Submit request")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}