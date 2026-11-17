import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Field from "@/components/fund/Field";
import { createEmergency } from "@/lib/server-fns";
import { uploadPrivate } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/LangContext";

const CASES = [
  { value: "hospital", label: "ആശുപത്രി", en: "Hospital" },
  { value: "medical", label: "മെഡിക്കൽ", en: "Medical" },
  { value: "urgent", label: "അടിയന്തിരം", en: "Urgent" },
];

export default function NewEmergencyDialog({ open, onOpenChange, onDone }) {
  const { lang, t } = useLang();
  const [form, setForm] = useState({ case_type: "hospital", amount: "", description: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error(t("തുക നൽകുക", "Enter an amount"));
    if (form.description.trim().length < 2) return toast.error(t("വിവരണം നൽകുക", "Enter a description"));
    setBusy(true);
    try {
      let document_url;
      if (file) document_url = await uploadPrivate(file);
      await createEmergency({
        data: { case_type: form.case_type, amount, description: form.description, document_url },
      });
      toast.success(t("അടിയന്തിര അഭ്യർത്ഥന സമർപ്പിച്ചു", "Emergency request submitted"));
      onOpenChange(false);
      setForm({ case_type: "hospital", amount: "", description: "" });
      setFile(null);
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
            {t("അടിയന്തിര അഭ്യർത്ഥന", "Emergency request")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <span className={lang === "en" ? "text-[13px] text-muted-foreground" : "font-mal text-[13px] text-muted-foreground"}>
              {t("സാഹചര്യം", "Situation")}
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {CASES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, case_type: item.value }))}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 font-mal transition-colors",
                    form.case_type === item.value
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground/70 hover:border-primary/30"
                  )}
                >
                  {t(item.label, item.en)}
                </button>
              ))}
            </div>
          </div>

          <Field label={t("ആവശ്യമായ തുക (₹)", "Amount needed (₹)")}>
            <Input
              type="number"
              min="1"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              placeholder="10000" />
          </Field>

          <Field label={t("വിവരണം", "Description")}>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={t("അടിയന്തിര സാഹചര്യം വിശദീകരിക്കുക", "Describe the emergency")}
            />
          </Field>

          <Field label={t("രേഖകൾ", "Documents")} hint={t("ഓപ്ഷണൽ", "Optional")}>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-card px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:border-primary/40">
              <Upload className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
              <span className="truncate">{file ? file.name : t("രേഖ തിരഞ്ഞെടുക്കുക", "Choose a document")}</span>
              <input
                type="file"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
          </Field>

          <p className={lang === "en" ? "px-3 py-2.5 text-[12.5px] leading-relaxed text-primary/90" : "px-3 py-2.5 font-mal text-[12.5px] leading-relaxed text-primary/90"}>
            {t(
              "നിയമം 2 — അടിയന്തിര സാഹചര്യങ്ങൾക്ക് മുൻഗണന നൽകും. എല്ലാ അംഗങ്ങളുടെയും തീരുമാനം ആവശ്യമാണ്.",
              "Rule 2 — emergencies get priority. Every member's decision is required."
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