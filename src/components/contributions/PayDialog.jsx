import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Field from "@/components/fund/Field";
import { submitContributionPayment } from "@/lib/server-fns";
import { uploadPrivate } from "@/lib/uploads";
import { inr } from "@/lib/format";
import { useLang } from "@/lib/LangContext";
import { cn } from "@/lib/utils";

export default function PayDialog({ contribution, allowCash, onDone, open, onOpenChange }) {
  const { lang, t } = useLang();
  const [method, setMethod] = useState("online");
  const [file, setFile] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const remaining = Math.max(0, Number(contribution?.amount_due || 0) - Number(contribution?.amount_paid || 0));

  const submit = async () => {
    if (method === "online" && !file) {
      toast.error(t("ഓൺലൈൻ പേയ്‌മെന്റിന് സ്ക്രീൻഷോട്ട് ആവശ്യമാണ്", "A screenshot is required for online payments"));
      return;
    }
    setBusy(true);
    try {
      let screenshot_uri;
      if (file) screenshot_uri = await uploadPrivate(file);
      await submitContributionPayment({
        data: { contribution_id: contribution.id, method, screenshot_uri, note: note || undefined },
      });
      toast.success(
        method === "cash"
          ? t("ക്യാഷ് രേഖപ്പെടുത്തി", "Cash payment recorded")
          : t("പേയ്‌മെന്റ് പരിശോധനയ്ക്ക് അയച്ചു", "Payment sent for verification")
      );
      setFile(null);
      setNote("");
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("രേഖപ്പെടുത്താനായില്ല", "Could not record"));
    } finally {
      setBusy(false);
    }
  };

  const options = [
    { value: "online", label: t("ഓൺലൈൻ", "Online") },
    ...(allowCash ? [{ value: "cash", label: t("ക്യാഷ്", "Cash") }] : []),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.4rem] border-border bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className={cn("text-[1.05rem] font-normal", lang === "en" ? "" : "font-mal")}>
            {t("സംഭാവന അടയ്ക്കുക", "Pay contribution")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("അടയ്ക്കാനുള്ളത്", "Amount due")}
            </p>
            <p className="mt-1 font-display tnum text-[1.5rem] leading-none">{inr(remaining)}</p>
            <p className="mt-1 font-mal text-[12.5px] text-muted-foreground">
              {contribution?.member_name} · {contribution?.week_start}
            </p>
          </div>

          <div>
            <span className={cn("text-[13px] text-muted-foreground", lang === "en" ? "" : "font-mal")}>
              {t("പേയ്‌മെന്റ് രീതി", "Payment method")}
            </span>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMethod(option.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-[13.5px] transition-colors",
                    lang === "en" ? "" : "font-mal",
                    method === option.value
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground/70 hover:border-primary/30"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {method === "online" && (
            <Field label={t("പേയ്‌മെന്റ് സ്ക്രീൻഷോട്ട്", "Payment screenshot")}>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-card px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/40">
                <Upload className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                <span className="truncate">{file ? file.name : t("സ്ക്രീൻഷോട്ട് തിരഞ്ഞെടുക്കുക", "Choose a screenshot")}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </label>
            </Field>
          )}

          <Field label={t("കുറിപ്പ്", "Note")}>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder={t("ഓപ്ഷണൽ", "Optional")}
            />
          </Field>

          <Button
            onClick={submit}
            disabled={busy || remaining <= 0}
            className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : method === "cash" ? (
              t("ക്യാഷ് രേഖപ്പെടുത്തുക", "Record cash")
            ) : (
              t("പേയ്‌മെന്റ് അയക്കുക", "Send payment")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
