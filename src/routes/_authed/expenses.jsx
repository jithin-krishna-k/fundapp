import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Plus, ReceiptText, Upload } from "lucide-react";
import PageHeader from "@/components/fund/PageHeader";
import StatusPill from "@/components/fund/StatusPill";
import EmptyState from "@/components/fund/EmptyState";
import Field from "@/components/fund/Field";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFund } from "@/lib/FundContext";
import { formatDate, inr, isoDate } from "@/lib/format";
import { uploadPrivate } from "@/lib/uploads";
import { createExpense, decideExpense } from "@/lib/server-fns";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed/expenses")({
  component: ExpensesPage,
});

const CATEGORIES = [
  { value: "stationery", label: "സ്റ്റേഷനറി", en: "Stationery" },
  { value: "printing", label: "പ്രിന്റിംഗ്", en: "Printing" },
  { value: "travel", label: "യാത്ര", en: "Travel" },
  { value: "refreshment", label: "റിഫ്രെഷ്മെന്റ്", en: "Refreshments" },
  { value: "other", label: "മറ്റുള്ളവ", en: "Other" },
];

function ExpensesPage() {
  const { t } = useLang();
  const fund = useFund();
  const { expenses, isAdmin, isHandler } = fund;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);

  const approved = expenses.filter((e) => e.status === "approved");
  const total = approved.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const decide = async (id, action) => {
    setBusy(id + action);
    try {
      await decideExpense({ data: { id, action } });
      toast.success(action === "approve" ? "അനുമതി നൽകി" : "നിരസിച്ചു");
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
        ml="ഫണ്ട് ചെലവുകൾ"
        en="Fund expenses"
        description={t(
          "സ്റ്റേഷനറി തുടങ്ങിയ ചെലവുകൾ ഫണ്ടിൽ നിന്നാണ് കണ്ടെത്തേണ്ടത് (നിയമം 14). അനുമതി ലഭിച്ച ചെലവുകൾ ബാലൻസിൽ നിന്ന് കുറയ്ക്കും.",
          "Costs like stationery are met from the fund (rule 14). Approved expenses are deducted from the balance."
        )}
        action={
          isHandler ? (
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} /> {t("ചെലവ് ചേർക്കുക", "Add expense")}
            </button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] border border-border bg-card px-4 py-3.5">
          <p className="text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground">Approved expenses</p>
          <p className="tnum mt-1 font-display text-[1.35rem] leading-none">{inr(total)}</p>
        </div>
        <div className="rounded-[1.2rem] border border-border bg-card px-4 py-3.5">
          <p className="text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground">Awaiting approval</p>
          <p className="tnum mt-1 font-display text-[1.35rem] leading-none">{expenses.filter((e) => e.status === "pending").length}</p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon={ReceiptText} ml="ചെലവുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല" en="No expenses recorded" />
      ) : (
        <div className="space-y-2">
          {expenses.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center gap-3 rounded-[1.2rem] border border-border bg-card px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="font-mal text-[14px] leading-tight">{item.description}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {t(
                    CATEGORIES.find((c) => c.value === item.category)?.label,
                    CATEGORIES.find((c) => c.value === item.category)?.en
                  )}{" "}
                  · {formatDate(item.expense_date)} · {item.recorded_by}
                </p>
              </div>
              <p className="tnum text-[14px] font-medium">{inr(item.amount)}</p>
              <StatusPill tone={item.status === "approved" ? "paid" : item.status === "rejected" ? "overdue" : "pending"}>
                {item.status === "approved"
                  ? t("അനുമതി", "Approved")
                  : item.status === "rejected"
                    ? t("നിരസിച്ചു", "Rejected")
                    : t("കാത്തിരിക്കുന്നു", "Pending")}
              </StatusPill>
              {isAdmin && item.status === "pending" && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => decide(item.id, "approve")}
                    disabled={busy === item.id + "approve"}
                    className="rounded-full bg-emerald-600/12 px-3 py-1.5 text-[12.5px] text-emerald-800"
                  >
                    {t("അനുമതി", "Approve")}
                  </button>
                  <button
                    onClick={() => decide(item.id, "reject")}
                    disabled={busy === item.id + "reject"}
                    className="rounded-full bg-red-600/10 px-3 py-1.5 text-[12.5px] text-red-800"
                  >
                    {t("നിരസിക്കുക", "Reject")}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <AddExpenseDialog open={open} onOpenChange={setOpen} onDone={() => fund.reload()} />
    </div>
  );
}

function AddExpenseDialog({ open, onOpenChange, onDone }) {
  const { t } = useLang();
  const [form, setForm] = useState({ category: "stationery", amount: "", expense_date: isoDate(new Date()), description: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return toast.error("തുക നൽകുക");
    if (form.description.trim().length < 2) return toast.error("വിവരണം നൽകുക");
    setBusy(true);
    try {
      let receipt_url;
      if (file) receipt_url = await uploadPrivate(file);
      await createExpense({ data: { ...form, amount, receipt_url } });
      toast.success("ചെലവ് രേഖപ്പെടുത്തി — അനുമതിക്കായി അയച്ചു");
      onOpenChange(false);
      setForm({ category: "stationery", amount: "", expense_date: isoDate(new Date()), description: "" });
      setFile(null);
      onDone?.();
    } catch (error) {
      toast.error(error?.message || "രേഖപ്പെടുത്താനായില്ല");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[1.4rem] border-border bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">{t("ചെലവ് ചേർക്കുക", "Add expense")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, category: item.value }))}
                className={cn(
                  "rounded-xl border px-2 py-2 font-mal text-[12.5px]",
                  form.category === item.value
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground/70"
                )}
              >
                {t(item.label, item.en)}
              </button>
            ))}
          </div>
          <Field label={t("തുക (₹)", "Amount (₹)")}>
            <Input type="number" value={form.amount} onChange={(event) => setForm((p) => ({ ...p, amount: event.target.value }))} />
          </Field>
          <Field label={t("തീയതി", "Date")}>
            <Input type="date" value={form.expense_date} onChange={(event) => setForm((p) => ({ ...p, expense_date: event.target.value }))} />
          </Field>
          <Field label={t("വിവരണം", "Description")}>
            <Textarea rows={2} value={form.description} onChange={(event) => setForm((p) => ({ ...p, description: event.target.value }))} />
          </Field>
          <Field label={t("രസീത്", "Receipt")} hint={t("ഓപ്ഷണൽ · സ്വകാര്യമായി സൂക്ഷിക്കുന്നു", "Optional · stored privately")}>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-card px-3 py-2.5 text-[13.5px] text-muted-foreground">
              <Upload className="h-4 w-4" strokeWidth={1.7} />
              <span className="truncate">{file ? file.name : t("രസീത് അപ്‌ലോഡ് ചെയ്യുക", "Upload receipt")}</span>
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </label>
          </Field>
          <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("രേഖപ്പെടുത്തുക", "Record")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}