import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Percent, Split } from "lucide-react";
import PageHeader from "@/components/fund/PageHeader";
import SectionHeading from "@/components/fund/SectionHeading";
import EmptyState from "@/components/fund/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Field from "@/components/fund/Field";
import { useFund } from "@/lib/FundContext";
import { formatDate, inr } from "@/lib/format";
import { lateInterest } from "@/lib/finance";
import { distributeInterest } from "@/lib/server-fns";
import { Loader2 } from "lucide-react";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed/interest")({
  component: InterestPage,
});

function InterestPage() {
  const { t } = useLang();
  const fund = useFund();
  const { summary, distributions, contributions, settings, isAdmin, members } = fund;
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const available = Math.max(0, summary.interestCollected - summary.distributed);
  const activeCount = members.filter((m) => m.status === "active").length || 1;

  const lateRows = useMemo(() => {
    const byMember = new Map();
    for (const row of contributions) {
      if (row.status === "paid") continue;
      const late = lateInterest(row, settings);
      if (late.interest <= 0) continue;
      const current = byMember.get(row.member_id) || { name: row.member_name, amount: 0, weeks: 0 };
      byMember.set(row.member_id, {
        name: row.member_name,
        amount: current.amount + late.interest,
        weeks: current.weeks + 1,
      });
    }
    return Array.from(byMember.values()).sort((a, b) => b.amount - a.amount);
  }, [contributions, settings]);

  const distribute = async () => {
    setBusy(true);
    try {
      await distributeInterest({ data: { notes: notes || undefined } });
      toast.success(t("പലിശ വിതരണം രേഖപ്പെടുത്തി", "Interest distribution recorded"));
      setOpen(false);
      setNotes("");
      fund.reload();
    } catch (error) {
      toast.error(error?.message || t("വിതരണം നടത്താനായില്ല", "Couldn't distribute interest"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        ml="പലിശ"
        en="Interest"
        description={t(
          "പലിശയിനത്തിൽ കിട്ടുന്ന തുക എല്ലാ അംഗങ്ങൾക്കും തുല്യമായി വീതിക്കുന്നു (നിയമം 10).",
          "Interest collected is shared equally among all members (rule 10)."
        )}
        action={
          isAdmin ? (
            <button
              onClick={() => setOpen(true)}
              disabled={available <= 0}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground disabled:opacity-40"
            >
              <Split className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("പലിശ വിതരണം", "Distribute interest")}
            </button>
          ) : null
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.2rem] border border-border bg-card px-4 py-3.5">
          <p className="text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground">Collected</p>
          <p className="tnum mt-1 font-display text-[1.35rem] leading-none">{inr(summary.interestCollected)}</p>
        </div>
        <div className="rounded-[1.2rem] border border-border bg-card px-4 py-3.5">
          <p className="text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground">Distributed</p>
          <p className="tnum mt-1 font-display text-[1.35rem] leading-none">{inr(summary.distributed)}</p>
        </div>
        <div className="rounded-[1.2rem] border border-primary/20 bg-primary/[0.06] px-4 py-3.5">
          <p className="text-[11.5px] uppercase tracking-[0.16em] text-primary/80">Available · per member</p>
          <p className="tnum mt-1 font-display text-[1.35rem] leading-none text-primary">
            {inr(available)} · {inr(Math.floor(available / activeCount))}
          </p>
        </div>
      </div>

      <section>
        <SectionHeading ml="കാലതാമസ പലിശ ബാക്കി" en="Late payment interest outstanding" />
        {lateRows.length === 0 ? (
          <EmptyState icon={Percent} ml="കാലതാമസ പലിശ ബാക്കിയില്ല" en="No late interest accrued" />
        ) : (
          <div className="overflow-hidden rounded-[1.2rem] border border-border bg-card">
            {lateRows.map((row, index) => (
              <div key={row.name + index} className={`flex items-center justify-between px-4 py-3 ${index ? "border-t border-border/70" : ""}`}>
                <div>
                  <p className="font-mal text-[14px]">{row.name}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {row.weeks} {t("ആഴ്ച കാലതാമസം", "weeks late")}
                  </p>
                </div>
                <p className="tnum text-[14px] text-red-700">{inr(row.amount)}</p>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 font-mal text-[12px] leading-relaxed text-muted-foreground">
          {t("നിയമം 4 — ആദ്യ 2 ആഴ്ച പലിശയില്ല. മൂന്നാമത്തെ ആഴ്ച മുതൽ ആഴ്ചയിൽ", "Rule 4 — no interest for the first 2 weeks. From the third week it is")} ₹
          {settings?.late_interest_per_week || 10}.
        </p>
      </section>

      <section>
        <SectionHeading ml="വിതരണ ചരിത്രം" en="Distribution history" />
        {distributions.length === 0 ? (
          <EmptyState icon={Split} ml="ഇതുവരെ പലിശ വിതരണം നടത്തിയിട്ടില്ല" en="No distributions yet" />
        ) : (
          <div className="space-y-2">
            {distributions.map((item) => (
              <article key={item.id} className="rounded-[1.2rem] border border-border bg-card px-4 py-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mal text-[14px]">{formatDate(item.distributed_date)}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {item.member_count} {t("അംഗങ്ങൾ", "members")} · {inr(item.per_member)}{" "}
                      {t("വീതം", "each")} · {item.initiated_by}
                    </p>
                  </div>
                  <p className="tnum font-display text-[1.15rem] leading-none">{inr(item.total_amount)}</p>
                </div>
                {item.notes && <p className="mt-2 font-mal text-[12.5px] text-muted-foreground">{item.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-[1.4rem] border-border bg-background sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mal text-[1.05rem] font-normal">{t("പലിശ വിതരണം", "Interest distribution")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5">
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">Per member</p>
              <p className="tnum mt-1 font-display text-[1.4rem] leading-none">{inr(Math.floor(available / activeCount))}</p>
              <p className="mt-1 font-mal text-[12.5px] text-muted-foreground">
                {t("ആകെ", "Total")} {inr(Math.floor(available / activeCount) * activeCount)} · {activeCount}{" "}
                {t("അംഗങ്ങൾ", "members")}
              </p>
            </div>
            <Field label={t("കുറിപ്പ്", "Note")}>
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("ഓപ്ഷണൽ", "Optional")} />
            </Field>
            <Button onClick={distribute} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("വിതരണം സ്ഥിരീകരിക്കുക", "Confirm distribution")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}