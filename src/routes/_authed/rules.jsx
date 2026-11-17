import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { BookOpen, Check, History, Loader2, Scale, X } from "lucide-react";
import PageHeader from "@/components/fund/PageHeader";
import SectionHeading from "@/components/fund/SectionHeading";
import StatusPill from "@/components/fund/StatusPill";
import Field from "@/components/fund/Field";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFund } from "@/lib/FundContext";
import { formatDate } from "@/lib/format";
import { proposeRuleChange, voteRuleChange } from "@/lib/server-fns";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed/rules")({
  component: RulesPage,
});

function RulesPage() {
  const { t } = useLang();
  const fund = useFund();
  const { rules, proposals, myMember, members } = fund;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(null);

  const activeRules = rules.filter((r) => r.active).sort((a, b) => a.number - b.number);
  const history = rules.filter((r) => !r.active).sort((a, b) => a.number - b.number || b.version - a.version);
  const openProposals = proposals.filter((p) => p.status === "open");
  const closedProposals = proposals.filter((p) => p.status !== "open");
  const activeCount = members.filter((m) => m.status === "active").length;

  const vote = async (id, decision) => {
    setBusy(id + decision);
    try {
      const result = await voteRuleChange({ data: { id, decision } });
      toast.success(
        result.status === "approved" ? "എല്ലാവരുടെയും അനുമതിയോടെ നിയമം പ്രാബല്യത്തിൽ വന്നു" : decision === "approve" ? "അനുമതി രേഖപ്പെടുത്തി" : "നിരസിച്ചു"
      );
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
        ml="ഫണ്ട് നിയമങ്ങൾ ⚖️"
        en="Fund rules"
        description="നിയമങ്ങൾ മാറ്റുന്നത് എല്ലാ അംഗങ്ങളുടെയും അറിവോടെ മാത്രം (നിയമം 11). ഏതൊരു മാറ്റത്തിനും എല്ലാവരുടെയും അനുമതി ആവശ്യമാണ്."
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground"
          >
            <Scale className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("നിയമ മാറ്റം നിർദ്ദേശിക്കുക", "Propose a rule change")}
          </button>
        }
      />

      {openProposals.length > 0 && (
        <section>
          <SectionHeading ml="നിർദ്ദേശങ്ങൾ" en="Open proposals" />
          <div className="space-y-3">
            {openProposals.map((proposal) => {
              const approvals = (proposal.votes || []).filter((v) => v.decision === "approve").length;
              const required = Number(proposal.required_approvals) || activeCount;
              const mine = (proposal.votes || []).find((v) => v.member_id === myMember?.id);
              return (
                <article key={proposal.id} className="rounded-[1.3rem] border border-primary/20 bg-primary/[0.04] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mal text-[14px]">{t("നിയമം", "Rule")} {proposal.rule_number}</p>
                    <span className="font-mal text-[12.5px] text-muted-foreground">
                      {approvals}/{required} {t("അനുമതി", "approvals")} · {proposal.proposed_by}
                    </span>
                  </div>
                  <p className="mt-2 font-mal text-[13.5px] leading-relaxed">{proposal.proposed_text}</p>
                  <p className="mt-2 font-mal text-[12.5px] leading-relaxed text-muted-foreground">
                    {t("കാരണം", "Reason")}: {proposal.reason}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!mine ? (
                      <>
                        <button
                          onClick={() => vote(proposal.id, "approve")}
                          disabled={busy === proposal.id + "approve"}
                          className="flex items-center gap-1 rounded-full bg-emerald-600/12 px-3 py-1.5 text-[12.5px] text-emerald-800"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2} /> {t("അനുമതി", "Approve")}
                        </button>
                        <button
                          onClick={() => vote(proposal.id, "reject")}
                          disabled={busy === proposal.id + "reject"}
                          className="flex items-center gap-1 rounded-full bg-red-600/10 px-3 py-1.5 text-[12.5px] text-red-800"
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} /> {t("വേണ്ട", "Reject")}
                        </button>
                      </>
                    ) : (
                      <span className="font-mal text-[12px] text-muted-foreground">
                        {t("നിങ്ങളുടെ തീരുമാനം", "Your decision")}:{" "}
                        {mine.decision === "approve" ? t("അനുമതി", "Approved") : t("വേണ്ട", "Rejected")}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <SectionHeading ml="നിലവിലുള്ള നിയമങ്ങൾ" en="Current rules" />
        {activeRules.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center font-mal text-[13.5px] text-muted-foreground">
            {t("നിയമങ്ങൾ ലോഡ് ചെയ്യുന്നു…", "Loading rules…")}
          </p>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {activeRules.map((rule) => (
              <article key={rule.id} className="rounded-[1.2rem] border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[12.5px] text-primary">
                    {rule.number}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Rule {rule.number}</span>
                </div>
                <p className="mt-2.5 font-mal text-[14px] leading-relaxed">{rule.text_ml}</p>
                {rule.text_en && <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{rule.text_en}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {closedProposals.length > 0 && (
        <section>
          <SectionHeading ml="മുൻ നിർദ്ദേശങ്ങൾ" en="Proposal history" />
          <div className="space-y-2">
            {closedProposals.map((proposal) => (
              <div key={proposal.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mal text-[13.5px]">{t("നിയമം", "Rule")} {proposal.rule_number}</p>
                  <p className="mt-0.5 truncate font-mal text-[12px] text-muted-foreground">{proposal.proposed_text}</p>
                </div>
                <StatusPill tone={proposal.status === "approved" ? "paid" : "overdue"}>
                  {proposal.status === "approved" ? t("അംഗീകരിച്ചു", "Approved") : t("നിരസിച്ചു", "Rejected")}
                </StatusPill>
                <span className="text-[11.5px] text-muted-foreground">{formatDate(proposal.decided_date)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <SectionHeading ml="പഴയ പതിപ്പുകൾ" en="Previous versions" />
          <div className="space-y-2">
            {history.map((rule) => (
              <div key={rule.id} className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <History className="h-3.5 w-3.5" strokeWidth={1.8} />
                  <p className="font-mal text-[13px]">
                    {t("നിയമം", "Rule")} {rule.number} · {t("പതിപ്പ്", "version")} {rule.version}
                  </p>
                </div>
                <p className="mt-1.5 font-mal text-[13px] leading-relaxed text-muted-foreground">{rule.text_ml}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProposeDialog open={open} onOpenChange={setOpen} rules={activeRules} onDone={() => fund.reload()} />
    </div>
  );
}

function ProposeDialog({ open, onOpenChange, rules, onDone }) {
  const { t } = useLang();
  const [number, setNumber] = useState(rules[0]?.number || 1);
  const [proposed, setProposed] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (proposed.trim().length < 4 || reason.trim().length < 4) return toast.error("പുതിയ നിയമവും കാരണവും നൽകുക");
    setBusy(true);
    try {
      await proposeRuleChange({ data: { rule_number: Number(number), proposed_text: proposed.trim(), reason: reason.trim() } });
      toast.success("നിർദ്ദേശം സമർപ്പിച്ചു — എല്ലാ അംഗങ്ങളുടെയും അനുമതി ആവശ്യമാണ്");
      onOpenChange(false);
      setProposed("");
      setReason("");
      onDone?.();
    } catch (error) {
      toast.error(error?.message || "സമർപ്പിക്കാനായില്ല");
    } finally {
      setBusy(false);
    }
  };

  const current = rules.find((r) => Number(r.number) === Number(number));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[1.4rem] border-border bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">{t("നിയമ മാറ്റ നിർദ്ദേശം", "Propose a rule change")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <Field label={t("നിയമ നമ്പർ", "Rule number")}>
            <select
              value={number}
              onChange={(event) => setNumber(event.target.value)}
              className="w-full rounded-xl border border-input bg-card px-3 py-2 font-mal text-[14px]"
            >
              {rules.map((rule) => (
                <option key={rule.id} value={rule.number}>
                  {t("നിയമം", "Rule")} {rule.number}
                </option>
              ))}
            </select>
          </Field>
          {current && (
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Current</p>
              <p className="mt-1 font-mal text-[13px] leading-relaxed">{current.text_ml}</p>
            </div>
          )}
          <Field label={t("പുതിയ നിയമം", "New rule text")}>
            <Textarea rows={3} value={proposed} onChange={(event) => setProposed(event.target.value)} />
          </Field>
          <Field label={t("മാറ്റത്തിന്റെ കാരണം", "Reason for the change")}>
            <Input value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("നിർദ്ദേശം സമർപ്പിക്കുക", "Submit proposal")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}