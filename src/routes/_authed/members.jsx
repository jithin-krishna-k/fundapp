import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, UserPlus, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/fund/PageHeader";
import SectionHeading from "@/components/fund/SectionHeading";
import StatusPill from "@/components/fund/StatusPill";
import EmptyState from "@/components/fund/EmptyState";
import Field from "@/components/fund/Field";
import { useFund } from "@/lib/FundContext";
import { formatDate, inr, isoDate } from "@/lib/format";
import { loanSummary } from "@/lib/finance";
import { recordHandover, removeMember, setMemberRole } from "@/lib/server-fns";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed/members")({
  component: MembersPage,
});

const ROLE_LABEL = {
  super_admin: { ml: "അഡ്മിൻ", en: "Admin" },
  cash_handler: { ml: "ക്യാഷ് ഹാൻഡ്ലർ", en: "Cash handler" },
  member: { ml: "അംഗം", en: "Member" },
};

function MembersPage() {
  const { t } = useLang();
  const fund = useFund();
  const { members, contributions, withdrawals, settings, isAdmin, summary, myMember } = fund;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);

  const active = members.filter((m) => m.status === "active");
  const pending = members.filter((m) => m.status === "pending");

  const contributedBy = (memberId) =>
    contributions
      .filter((c) => c.member_id === memberId)
      .reduce((sum, c) => sum + Number(c.amount_paid || 0), 0);

  const outstandingBy = (email) =>
    withdrawals
      .filter((w) => w.member_email === email && ["approved", "disbursed"].includes(w.status))
      .reduce((sum, w) => sum + loanSummary(w, settings).remaining, 0);

  const approve = async (member) => {
    try {
      await base44.entities.Member.update(member.id, { status: "active", join_date: isoDate(new Date()), removed_date: null });
      await base44.entities.Notification.create({
        user_email: member.user_email,
        member_name: member.full_name,
        title: "അംഗത്വം അനുവദിച്ചു",
        body: "എല്ലാ അംഗങ്ങളുടെയും അനുമതിയോടെ നിങ്ങൾ ഗ്രൂപ്പിൽ ചേർന്നു.",
        type: "new_member",
        link: "/",
        read: false,
      });
      toast.success(t("അംഗത്വം അനുവദിച്ചു", "Membership approved"));
      fund.reload();
    } catch (error) {
      toast.error(error?.message || t("അനുവദിക്കാനായില്ല", "Couldn't approve"));
    }
  };

  const changeRole = async (member, fund_role) => {
    try {
      await setMemberRole({ data: { member_id: member.id, fund_role } });
      toast.success(
        fund_role === "super_admin"
          ? t("അഡ്മിൻ ആക്കി", "Made admin")
          : t("അഡ്മിൻ പദവി ഒഴിവാക്കി", "Admin role removed")
      );
      fund.reload();
    } catch (error) {
      toast.error(error?.message || t("റോൾ മാറ്റാനായില്ല", "Could not change role"));
    }
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        ml="അംഗങ്ങൾ"
        en="Members"
        description={t(`${active.length} സജീവ അംഗങ്ങൾ · ആകെ ${inr(summary.contributionsTotal)} സംഭാവന ലഭിച്ചു.`, `${active.length} active members · ${inr(summary.contributionsTotal)} contributed in total.`)}
        action={
          isAdmin ? (
            <div className="flex gap-2">
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground"
              >
                <UserPlus className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("അംഗത്തെ ക്ഷണിക്കുക", "Invite member")}
              </button>
              <button
                onClick={() => setHandoverOpen(true)}
                className="rounded-full border border-border bg-card px-4 py-2 text-[13px] text-foreground/80"
              >
                {t("ക്യാഷ് ഹാൻഡ്ലർ മാറ്റുക", "Change cash handler")}
              </button>
            </div>
          ) : null
        }
      />

      {isAdmin && pending.length > 0 && (
        <section>
          <SectionHeading ml="അനുമതിക്കായി കാത്തിരിക്കുന്നു" en="Pending approval" />
          <div className="space-y-2">
            {pending.map((member) => (
              <div key={member.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mal text-[14px]">{member.full_name}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{member.user_email}</p>
                </div>
                <button
                  onClick={() => approve(member)}
                  className="rounded-full bg-emerald-600/12 px-3 py-1.5 text-[12.5px] text-emerald-800"
                >
                  {t("അംഗത്വം അനുവദിക്കുക", "Approve membership")}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading ml="ഗ്രൂപ്പ് അംഗങ്ങൾ" en="Group members" />
        {active.length === 0 ? (
          <EmptyState icon={Users} ml="അംഗങ്ങൾ ഇല്ല" en="No active members yet" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((member) => (
              <article key={member.id} className="rounded-[1.3rem] border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-mal text-[14.5px]">
                    {(member.full_name || "?").trim().charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mal text-[14.5px]">{member.full_name}</p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{member.user_email}</p>
                  </div>
                  <StatusPill tone={member.fund_role === "super_admin" ? "accent" : member.fund_role === "cash_handler" ? "partial" : "neutral"}>
                    {t(ROLE_LABEL[member.fund_role]?.ml, ROLE_LABEL[member.fund_role]?.en)}
                  </StatusPill>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border/70 pt-3">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Contributed</dt>
                    <dd className="tnum mt-0.5 text-[13px]">{inr(contributedBy(member.id))}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Outstanding</dt>
                    <dd className="tnum mt-0.5 text-[13px]">{inr(outstandingBy(member.user_email))}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Joined</dt>
                    <dd className="mt-0.5 text-[13px]">{member.join_date ? formatDate(member.join_date) : "—"}</dd>
                  </div>
                </dl>
                {member.user_email === myMember?.user_email && (
                  <p className="mt-2 text-[11.5px] uppercase tracking-[0.14em] text-primary">this is you</p>
                )}
                {isAdmin && member.user_email !== myMember?.user_email && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {member.fund_role === "super_admin" ? (
                      <button
                        onClick={() => changeRole(member, "member")}
                        className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t("അഡ്മിൻ പദവി ഒഴിവാക്കുക", "Remove admin")}
                      </button>
                    ) : (
                      <button
                        onClick={() => changeRole(member, "super_admin")}
                        className="text-[12px] text-primary transition-colors hover:text-primary/80"
                      >
                        {t("അഡ്മിൻ ആക്കുക", "Make admin")}
                      </button>
                    )}
                    <button
                      onClick={() => setRemoveTarget(member)}
                      className="text-[12px] text-destructive/80 transition-colors hover:text-destructive"
                    >
                      {t("അംഗത്തെ ഒഴിവാക്കുക", "Remove member")}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} members={members} onDone={() => fund.reload()} />
      <HandoverDialog
        open={handoverOpen}
        onOpenChange={setHandoverOpen}
        members={active}
        cashBalance={summary.cashBalance}
        onDone={() => fund.reload()}
      />
      <RemoveMemberDialog
        member={removeTarget}
        open={!!removeTarget}
        onOpenChange={(next) => !next && setRemoveTarget(null)}
        onDone={() => fund.reload()}
      />
    </div>
  );
}

function InviteDialog({ open, onOpenChange, members = [], onDone }) {
  const { t } = useLang();
  const [form, setForm] = useState({ email: "", full_name: "" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.email.trim() || !form.full_name.trim()) return toast.error(t("പേരും ഇമെയിലും നൽകുക", "Enter a name and email"));
    const email = form.email.trim().toLowerCase();
    const name = form.full_name.trim();
    const existing = members.find((m) => String(m.user_email || "").trim().toLowerCase() === email);
    if (existing?.status === "active") {
      return toast.error(t("ഈ ഇമെയിൽ ഇതിനകം ഒരു അംഗമാണ്", "This email is already a member"));
    }
    setBusy(true);
    try {
      await base44.users.inviteUser(email, "user");
      if (existing) {
        // Previously removed (status inactive) or already pending: reactivate the same record.
        // Creating a second Member for the email violates app_records_member_email_uniq.
        await base44.entities.Member.update(existing.id, {
          full_name: name,
          status: "pending",
          fund_role: "member",
          removed_date: null,
        });
      } else {
        await base44.entities.Member.create({
          user_email: email,
          full_name: name,
          status: "pending",
          fund_role: "member",
        });
      }
      toast.success(t("ക്ഷണം അയച്ചു — എല്ലാ അംഗങ്ങളുടെയും അനുമതിക്ക് ശേഷം പ്രവേശനം", "Invite sent — access starts once every member approves"));
      setForm({ email: "", full_name: "" });
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("ക്ഷണം അയക്കാനായില്ല", "Couldn't send the invite"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">{t("അംഗത്തെ ക്ഷണിക്കുക", "Invite a member")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <p className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] px-3 py-2.5 font-mal text-[12.5px] leading-relaxed text-primary/90">
            {t("നിയമം 9 — പുതിയ അംഗത്തെ ഉൾപ്പെടുത്താൻ എല്ലാ അംഗങ്ങളുടെയും അനുവാദം ആവശ്യമാണ്. അനുമതി വരെ പ്രവേശനം ഉണ്ടാകില്ല.", "Rule 9 — adding a new member needs every member's approval. No access until then.")}
          </p>
          <Field label={t("പേര്", "Name")}>
            <Input value={form.full_name} onChange={(event) => setForm((p) => ({ ...p, full_name: event.target.value }))} />
          </Field>
          <Field label={t("ഇമെയിൽ", "Email")}>
            <Input type="email" value={form.email} onChange={(event) => setForm((p) => ({ ...p, email: event.target.value }))} />
          </Field>
          <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ക്ഷണം അയക്കുക", "Send invite")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RemoveMemberDialog({ member, open, onOpenChange, onDone }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!member) return;
    setBusy(true);
    try {
      await removeMember({ data: { member_id: member.id } });
      toast.success(t("അംഗത്തെ ഒഴിവാക്കി", "Member removed"));
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("ഒഴിവാക്കാനായില്ല", "Could not remove member"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">
            {t("അംഗത്തെ ഒഴിവാക്കുക", "Remove member")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <p className="rounded-xl border border-destructive/25 bg-destructive/[0.05] px-3 py-2.5 font-mal text-[12.5px] leading-relaxed text-destructive">
            {t(
              "ഈ അംഗത്തെ ഗ്രൂപ്പിൽ നിന്ന് ഒഴിവാക്കാൻ പോകുന്നു. അവരുടെ സംഭാവനയും വായ്പാ ചരിത്രവും നിലനിൽക്കും; ഇനി പുതിയ രേഖകൾ ഉണ്ടാകില്ല.",
              "This member will be removed from the group. Their contribution and loan history stays intact; no new records will be created."
            )}
          </p>
          {member && (
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <p className="truncate font-mal text-[14px]">{member.full_name}</p>
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{member.user_email}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="w-full rounded-full py-5 text-[14px]">
              {t("റദ്ദാക്കുക", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={submit} disabled={busy} className="w-full rounded-full py-5 text-[14px]">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ഒഴിവാക്കുക", "Remove")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HandoverDialog({ open, onOpenChange, members, cashBalance, onDone }) {
  const { t } = useLang();
  const [target, setTarget] = useState("");
  const [balance, setBalance] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!target) return toast.error(t("പുതിയ ക്യാഷ് ഹാൻഡ്ലറെ തിരഞ്ഞെടുക്കുക", "Choose the new cash handler"));
    setBusy(true);
    try {
      await recordHandover({
        data: { to_member_id: target, cash_balance: Number(balance) || 0, notes: notes || undefined },
      });
      toast.success(t("ക്യാഷ് ഹാൻഡ്ലർ മാറ്റി", "Cash handler changed"));
      onOpenChange(false);
      setTarget("");
      setBalance("");
      setNotes("");
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("മാറ്റാനായില്ല", "Couldn't change it"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">{t("ക്യാഷ് ഹാൻഡ്ലർ മാറ്റം", "Cash handler handover")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <Field label={t("പുതിയ ക്യാഷ് ഹാൻഡ്ലർ", "New cash handler")}>
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="w-full rounded-xl border border-input bg-card px-3 py-2 font-mal text-[14px]"
            >
              <option value="">{t("തിരഞ്ഞെടുക്കുക", "Select")}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t("കൈമാറുന്ന ക്യാഷ് ബാലൻസ് (₹)", "Cash balance handed over (₹)")}
            hint={`${t("നിലവിലെ ക്യാഷ് ബാലൻസ്", "Current cash balance")} ${inr(cashBalance)}`}
          >
            <Input type="number" value={balance} onChange={(event) => setBalance(event.target.value)} placeholder={String(Math.round(cashBalance || 0))} />
          </Field>
          <Field label={t("കുറിപ്പ്", "Note")}>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("ഹാൻഡ്ഓവർ വിവരം", "Handover details")} />
          </Field>
          <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ഹാൻഡ്ഓവർ രേഖപ്പെടുത്തുക", "Record handover")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}