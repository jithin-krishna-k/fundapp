import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarClock, Loader2, LogOut, ShieldCheck, UserCog } from "lucide-react";
import PageHeader from "@/components/fund/PageHeader";
import SectionHeading from "@/components/fund/SectionHeading";
import Field from "@/components/fund/Field";
import StatusPill from "@/components/fund/StatusPill";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFund } from "@/lib/FundContext";
import { useAuth } from "@/lib/AuthContext";
import { addDays, formatDate, inr, isoDate } from "@/lib/format";
import { closeCycle, saveFundSettings, startCycle } from "@/lib/server-fns";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useLang();
  const fund = useFund();
  const { settings, isAdmin, cycle, summary, handovers, members, myMember } = fund;
  const { user, logout } = useAuth();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);

  useEffect(() => {
    if (!settings || form) return;
    setForm({
      weekly_amount: String(settings.weekly_amount ?? 250),
      late_interest_per_week: String(settings.late_interest_per_week ?? 10),
      late_interest_grace_weeks: String(settings.late_interest_grace_weeks ?? 2),
      borrowing_interest_percent: String(settings.borrowing_interest_percent ?? 1),
      borrowing_interest_mode: settings.borrowing_interest_mode || "flat",
      emergency_requires_all: settings.emergency_requires_all !== false,
    });
  }, [settings, form]);

  const cashHandler = members.find((m) => m.fund_role === "cash_handler" && m.status === "active");

  const save = async () => {
    if (!form) return;
    setBusy(true);
    try {
      await saveFundSettings({
        data: {
          weekly_amount: Number(form.weekly_amount),
          late_interest_per_week: Number(form.late_interest_per_week),
          late_interest_grace_weeks: Number(form.late_interest_grace_weeks),
          borrowing_interest_percent: Number(form.borrowing_interest_percent),
          borrowing_interest_mode: form.borrowing_interest_mode,
          emergency_requires_all: form.emergency_requires_all,
        },
      });
      toast.success("ക്രമീകരണങ്ങൾ സേവ് ചെയ്തു");
      fund.reload();
    } catch (error) {
      toast.error(error?.message || "സേവ് ചെയ്യാനായില്ല");
    } finally {
      setBusy(false);
    }
  };

  const closeCurrent = async () => {
    setBusy(true);
    try {
      const result = await closeCycle({ data: {} });
      toast.success(`സൈക്കിൾ അവസാനിപ്പിച്ചു · അവസാന ബാലൻസ് ${inr(result.balance)}`);
      fund.reload();
    } catch (error) {
      toast.error(error?.message || "അവസാനിപ്പിക്കാനായില്ല");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        ml="ക്രമീകരണങ്ങൾ"
        en="Settings"
        description={t(
          "ഫണ്ട് നിയമങ്ങളുടെ സംഖ്യകൾ, സൈക്കിൾ, ക്യാഷ് ഹാൻഡ്ലർ എന്നിവ ഇവിടെ നിയന്ത്രിക്കാം.",
          "Control the fund amounts, the cycle and the cash handler here."
        )}
      />

      <section className="rounded-[1.4rem] border border-border bg-card p-5">
        <SectionHeading ml="ഫണ്ട് ക്രമീകരണങ്ങൾ" en="Fund settings" />
        {!form ? (
          <p className="font-mal text-[12px] text-muted-foreground">{t("ലോഡ് ചെയ്യുന്നു…", "Loading…")}</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("ആഴ്ച സംഭാവന (₹)", "Weekly contribution (₹)")}>
                <Input
                  type="number"
                  value={form.weekly_amount}
                  disabled={!isAdmin}
                  onChange={(event) => setForm((p) => ({ ...p, weekly_amount: event.target.value }))}
                />
              </Field>
              <Field label={t("കാലതാമസ പലിശ / ആഴ്ച (₹)", "Late interest / week (₹)")}>
                <Input
                  type="number"
                  value={form.late_interest_per_week}
                  disabled={!isAdmin}
                  onChange={(event) => setForm((p) => ({ ...p, late_interest_per_week: event.target.value }))}
                />
              </Field>
              <Field
                label={t("പലിശ ഇല്ലാത്ത ആഴ്ചകൾ", "Interest-free weeks")}
                hint={t("ആദ്യത്തെ എത്ര ആഴ്ച പലിശയില്ല", "How many weeks pass without interest")}
              >
                <Input
                  type="number"
                  value={form.late_interest_grace_weeks}
                  disabled={!isAdmin}
                  onChange={(event) => setForm((p) => ({ ...p, late_interest_grace_weeks: event.target.value }))}
                />
              </Field>
              <Field label={t("വായ്പ പലിശ (%)", "Borrowing interest (%)")}>
                <Input
                  type="number"
                  step="0.1"
                  value={form.borrowing_interest_percent}
                  disabled={!isAdmin}
                  onChange={(event) => setForm((p) => ({ ...p, borrowing_interest_percent: event.target.value }))}
                />
              </Field>
            </div>

            <div>
              <span className="mb-1.5 block font-mal text-[11.5px] text-muted-foreground">
                {t("വായ്പ പലിശ കണക്കാക്കുന്ന രീതി", "How borrowing interest is calculated")}
              </span>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    value: "flat",
                    label: t("ഒരു തവണ മാത്രം", "Once only"),
                    hint: t("₹10,000 വായ്പയ്ക്ക് ₹100 പലിശ (ഒരിക്കൽ)", "₹100 interest on a ₹10,000 loan (one time)"),
                  },
                  {
                    value: "weekly",
                    label: t("ആഴ്ചതോറും", "Every week"),
                    hint: t("ഓരോ ആഴ്ചയും 1% വീതം കൂടും", "Adds 1% for each week it stays open"),
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setForm((p) => ({ ...p, borrowing_interest_mode: option.value }))}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-left transition-colors",
                      form.borrowing_interest_mode === option.value
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-background/60"
                    )}
                  >
                    <span className="block font-mal text-[12px]">{option.label}</span>
                    <span className="mt-0.5 block font-mal text-[10.5px] text-muted-foreground">{option.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && (
              <Button onClick={save} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-[12px] text-primary-foreground">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("സേവ് ചെയ്യുക", "Save")}
              </Button>
            )}
            {!isAdmin && (
              <p className="font-mal text-[11px] text-muted-foreground">
                {t("മാറ്റങ്ങൾ വരുത്താൻ സൂപ്പർ അഡ്മിന് മാത്രമേ കഴിയൂ.", "Only the super admin can make changes.")}
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-[1.4rem] border border-border bg-card p-5">
        <SectionHeading ml="ഫണ്ട് സൈക്കിൾ" en="Fund cycle" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mal text-[13px]">{cycle?.name || "—"}</p>
            <p className="mt-1 text-[10.5px] text-muted-foreground">
              {formatDate(cycle?.start_date)} → {formatDate(cycle?.proposed_close_date)}
            </p>
          </div>
          <StatusPill tone={cycle?.status === "active" ? "paid" : "neutral"}>
            {cycle?.status === "active" ? t("നടന്നുകൊണ്ടിരിക്കുന്നു", "Active") : t("അവസാനിച്ചു", "Closed")}
          </StatusPill>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border/70 pt-4 sm:grid-cols-4">
          {[
            [t("സംഭാവന", "Contributions"), inr(summary.contributionsTotal)],
            [t("പലിശ", "Interest"), inr(summary.interestCollected)],
            [t("വായ്പ ബാക്കി", "Loan outstanding"), inr(summary.outstanding)],
            [t("ബാലൻസ്", "Balance"), inr(summary.balance)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="font-mal text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
              <dd className="tnum mt-0.5 text-[12px]">{value}</dd>
            </div>
          ))}
        </dl>

        {isAdmin && (
          <div className="mt-4 flex flex-wrap gap-2">
            {cycle?.status === "active" ? (
              <button
                onClick={closeCurrent}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[11.5px] text-foreground/80 disabled:opacity-50"
              >
                <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("സൈക്കിൾ അവസാനിപ്പിക്കുക", "Close this cycle")}
              </button>
            ) : (
              <button
                onClick={() => setCycleOpen(true)}
                className="rounded-full bg-primary px-4 py-2 text-[11.5px] text-primary-foreground"
              >
                {t("പുതിയ സൈക്കിൾ ആരംഭിക്കുക", "Start a new cycle")}
              </button>
            )}
          </div>
        )}
        <p className="mt-2 font-mal text-[10.5px] leading-relaxed text-muted-foreground">
          ഓണം / വിഷു / ന്യൂ ഇയർ സമയത്ത് ഫണ്ട് പിരിഞ്ഞ് പുനരാരംഭിക്കുന്നു (നിയമം 15). പഴയ രേഖകൾ ഒരിക്കലും നീക്കം ചെയ്യില്ല.
        </p>
      </section>

      <section className="rounded-[1.4rem] border border-border bg-card p-5">
        <SectionHeading ml="ക്യാഷ് ഹാൻഡ്ലർ" en="Cash handler" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-[13px]">
              {(cashHandler?.full_name || "—").charAt(0)}
            </span>
            <div>
              <p className="font-mal text-[12.5px]">{cashHandler?.full_name || t("നിയോഗിച്ചിട്ടില്ല", "Not assigned")}</p>
              <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Current handler</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Cash balance</p>
            <p className="tnum text-[13px]">{inr(summary.cashBalance)}</p>
          </div>
        </div>

        {handovers.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-border/70 pt-3">
            <p className="text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Handover history</p>
            {handovers.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-mal">
                  {item.from_member_name} → {item.to_member_name}
                </span>
                <span className="tnum text-muted-foreground">
                  {inr(item.cash_balance)} · {formatDate(item.handover_date)}
                </span>
              </div>
            ))}
          </div>
        )}
        {isAdmin && (
          <p className="mt-3 flex items-center gap-1.5 font-mal text-[10.5px] text-muted-foreground">
            <UserCog className="h-3.5 w-3.5" strokeWidth={1.8} />{" "}
            {t("ഹാൻഡ്ലർ മാറ്റാൻ അംഗങ്ങൾ പേജ് ഉപയോഗിക്കുക.", "Use the members page to change the handler.")}
          </p>
        )}
      </section>

      <section className="rounded-[1.4rem] border border-border bg-card p-5">
        <SectionHeading ml="എന്റെ അക്കൗണ്ട്" en="My account" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mal text-[12.5px]">{myMember?.full_name || user?.full_name}</p>
            <p className="mt-0.5 text-[10.5px] text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-[11.5px] text-foreground/80"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("പുറത്ത് കടക്കുക", "Sign out")}
          </button>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-dashed border-border bg-background/60 px-3 py-2.5">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          <p className="font-mal text-[10.5px] leading-relaxed text-muted-foreground">
            ഈ ആപ്പ് അംഗങ്ങൾക്ക് മാത്രമുള്ളതാണ് (നിയമം 8). ഫണ്ട് വിവരങ്ങൾ പുറത്ത് പങ്കുവയ്ക്കരുത്. എല്ലാ സാമ്പത്തിക
            മാറ്റങ്ങളും ഓഡിറ്റ് ലോഗിൽ രേഖപ്പെടുത്തുന്നു.
          </p>
        </div>
      </section>

      <StartCycleDialog open={cycleOpen} onOpenChange={setCycleOpen} onDone={() => fund.reload()} />
    </div>
  );
}

function StartCycleDialog({ open, onOpenChange, onDone }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: "",
    start_date: isoDate(new Date()),
    proposed_close_date: isoDate(addDays(new Date(), 330)),
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (form.name.trim().length < 2) return toast.error("സൈക്കിളിന് പേര് നൽകുക");
    setBusy(true);
    try {
      await startCycle({
        data: {
          name: form.name.trim(),
          start_date: form.start_date,
          proposed_close_date: form.proposed_close_date,
        },
      });
      toast.success("പുതിയ സൈക്കിൾ ആരംഭിച്ചു");
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error?.message || "ആരംഭിക്കാനായില്ല");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">{t("പുതിയ ഫണ്ട് സൈക്കിൾ", "New fund cycle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <Field label={t("സൈക്കിളിന്റെ പേര്", "Cycle name")}>
            <Input
              value={form.name}
              onChange={(event) => setForm((p) => ({ ...p, name: event.target.value }))}
              placeholder={t("ഉദാ: ഓണം 2026", "e.g. Onam 2026")}
            />
          </Field>
          <Field label={t("ആരംഭ തീയതി", "Start date")}>
            <Input type="date" value={form.start_date} onChange={(event) => setForm((p) => ({ ...p, start_date: event.target.value }))} />
          </Field>
          <Field label={t("അവസാനിക്കേണ്ട തീയതി", "Expected close date")}>
            <Input
              type="date"
              value={form.proposed_close_date}
              onChange={(event) => setForm((p) => ({ ...p, proposed_close_date: event.target.value }))}
            />
          </Field>
          <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[12.5px] text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ആരംഭിക്കുക", "Start")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}