import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Field from "@/components/fund/Field";
import { recordRepayment } from "@/lib/server-fns";
import { inr } from "@/lib/format";
import { useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

export default function RepayDialog({ loan, remaining, open, onOpenChange, onDone }) {
  const lang = useLang();
  const { t } = lang;
  const isEnglish = lang === "en";

  const [amount, setAmount] = useState(
    remaining ? String(Math.round(remaining)) : ""
  );
  const [method, setMethod] = useState("cash");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const value = Number(amount);

    if (!value || value <= 0) {
      return toast.error(t("തുക നൽകുക", "Enter an amount"));
    }

    setBusy(true);

    try {
      const result = await recordRepayment({
        data: { id: loan.id, amount: value, method },
      });

      toast.success(
        result.settled
          ? t("വായ്പ പൂർണ്ണമായി തീർത്തു", "Loan fully settled")
          : t("തിരിച്ചടവ് രേഖപ്പെടുത്തി", "Repayment recorded")
      );

      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(
        error?.message || t("രേഖപ്പെടുത്താനായില്ല", "Could not record")
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle
            className={
              isEnglish
                ? "font-normal"
                : "font-mal text-[1.05rem] font-normal"
            }
          >
            {t("തിരിച്ചടവ് രേഖപ്പെടുത്തുക", "Record repayment")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p
              className={
                isEnglish
                  ? "text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
                  : ""
              }
            >
              Remaining
            </p>

            <p className="tnum mt-1 font-display text-[1.4rem] leading-none">
              {inr(remaining)}
            </p>

            <p
              className={
                isEnglish
                  ? "mt-1"
                  : "mt-1 font-mal text-[11px] text-muted-foreground"
              }
            >
              {loan?.member_name}
            </p>
          </div>

          <Field label={t("തുക (₹)", "Amount (₹)")}>
            <Input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            {["cash", "online"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMethod(option)}
                className={cn(
                  "rounded-xl border px-3 py-2.5",
                  !isEnglish && "font-mal",
                  method === option
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground/70"
                )}
              >
                {option === "cash"
                  ? t("ക്യാഷ്", "Cash")
                  : t("ഓൺലൈൻ", "Online")}
              </button>
            ))}
          </div>

          <Button
            onClick={submit}
            disabled={busy}
            className="w-full rounded-full bg-primary py-5 text-[12.5px] text-primary-foreground"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("രേഖപ്പെടുത്തുക", "Record")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}