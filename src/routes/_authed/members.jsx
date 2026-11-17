import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Loader2, ShieldCheck, ShieldOff, UserMinus, UserPlus, Users, X } from "lucide-react";
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
import { inviteMember, recordHandover, removeMember, setMemberRole, voteMembership } from "@/lib/server-fns";
import { useLang } from "@/lib/LangContext";

export const Route = createFileRoute("/_authed/members")({
  component: MembersPage,
});

const ROLE_LABEL = {
  super_admin: { ml: "അഡ്‌മിൻ", en: "Admin" },
  cash_handler: { ml: "കാഷ് ഹാൻഡ്ലർ", en: "Cash handler" },
  member: { ml: "അംഗം", en: "Member" },
};

function MembersPage() {
  const { t } = useLang();
  const fund = useFund();
  const { members, contributions, withdrawals, settings, isAdmin, summary, myMember } = fund;
  const [inviteOpen, setInviteOpen] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [roleTarget, setRoleTarget] = useState(null);

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

  const changeRole = (member, role) => setRoleTarget({ member, role });

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        ml="അംഗങ്ങൾ"
        en="Members"
        description={t(`${active.length} സജീവ അംഗങ്ങൾ`, `${active.length} active members`)}
        action={
          isAdmin ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                onClick={() => setInviteOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] text-primary-foreground sm:w-auto"
              >
                <UserPlus className="h-3.5 w-3.5" strokeWidth={1.8} /> {t("അംഗത്തെ ക്ഷണിക്കുക", "Invite member")}
              </button>
              <button
                onClick={() => setHandoverOpen(true)}
                className="w-full rounded-full border border-border bg-card px-4 py-2 text-[13px] text-foreground/80 sm:w-auto"
              >
                {t("കാഷ് ഹാൻഡ്ലർ മാറ്റുക", "Change cash handler")}
              </button>
            </div>
          ) : null
        }
      />

      {pending.length > 0 && (
        <MembershipRequests requests={pending} voters={active} me={myMember} onDone={() => fund.reload()} />
      )}

      <section>
        <SectionHeading ml="ഗ്രൂപ്പ് അംഗങ്ങൾ" en="Group members" />
        {active.length === 0 ? (
          <EmptyState icon={Users} ml="സജീവ അംഗങ്ങൾ ഇല്ല" en="No active members yet" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.map((member) => {
              const isMe = member.user_email === myMember?.user_email;
              const outstanding = outstandingBy(member.user_email);
              const initial = (member.full_name || "?").trim().charAt(0).toUpperCase();
              return (
                <article
                  key={member.id}
                  className={`flex flex-col rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md sm:p-5 ${
                    isMe ? "border-primary/40 ring-1 ring-primary/15" : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-[16px] font-semibold text-primary sm:h-12 sm:w-12 sm:text-[17px]">
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="min-w-0 break-words font-mal text-[15px] font-semibold sm:text-[15.5px]">{member.full_name}</p>
                        {isMe && (
                          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                            {t("നിങ്ങൾ", "You")}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 break-all text-[12.5px] text-muted-foreground sm:truncate" title={member.user_email}>
                        {member.user_email}
                      </p>
                      <div className="mt-2 sm:hidden">
                        <StatusPill tone={member.fund_role === "super_admin" ? "accent" : member.fund_role === "cash_handler" ? "partial" : "neutral"}>
                          {t(ROLE_LABEL[member.fund_role]?.ml, ROLE_LABEL[member.fund_role]?.en)}
                        </StatusPill>
                      </div>
                    </div>
                    <div className="hidden shrink-0 sm:block">
                      <StatusPill tone={member.fund_role === "super_admin" ? "accent" : member.fund_role === "cash_handler" ? "partial" : "neutral"}>
                        {t(ROLE_LABEL[member.fund_role]?.ml, ROLE_LABEL[member.fund_role]?.en)}
                      </StatusPill>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                      <dt className="font-mal text-[12px] text-muted-foreground">{t("വരവ്", "Contributed")}</dt>
                      <dd className="tnum mt-1 text-[15px] font-semibold text-emerald-700">{inr(contributedBy(member.id))}</dd>
                    </div>
                    <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                      <dt className="font-mal text-[12px] text-muted-foreground">{t("ബാക്കിയുള്ളത്", "Outstanding")}</dt>
                      <dd className={`tnum mt-1 text-[15px] font-semibold ${outstanding > 0 ? "text-red-600" : "text-foreground"}`}>
                        {inr(outstanding)}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                      <dt className="font-mal text-[12px] text-muted-foreground">{t("ചേർന്ന തീയതി", "Joined")}</dt>
                      <dd className="mt-1 text-[13.5px] font-medium">{member.join_date ? formatDate(member.join_date) : "—"}</dd>
                    </div>
                  </dl>

                  {member.fund_role === "super_admin" && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/15 bg-accent/60 px-3.5 py-3">
                      <ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.9} />
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-primary">{t("പൂർണ്ണ അനുമതികൾ", "Full access")}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                          {t(
                            "അംഗങ്ങളെ ചേർക്കാനും നീക്കം ചെയ്യാനും, പേയ്‌മെന്റുകളും അഭ്യർത്ഥനകളും അംഗീകരിക്കാനും ഫണ്ട് ക്രമീകരണങ്ങൾ കൈകാര്യം ചെയ്യാനും കഴിയും.",
                            "Can add and remove members, approve payments and fund requests, and manage fund settings and cycles."
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {isAdmin && !isMe && <div aria-hidden="true" className="min-h-[1rem] flex-1" />}
                  {isAdmin && !isMe && (
                    <div className="flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap">
                      {member.fund_role === "super_admin" ? (
                        <button
                          onClick={() => changeRole(member, "member")}
                          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-[12.5px] text-foreground/80 transition-colors hover:bg-secondary sm:w-auto"
                        >
                          <ShieldOff className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {t("അഡ്‌മിൻ നീക്കം ചെയ്യുക", "Remove admin")}
                        </button>
                      ) : (
                        <button
                          onClick={() => changeRole(member, "super_admin")}
                          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-2 text-[12.5px] text-primary transition-colors hover:bg-primary/10 sm:w-auto"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {t("അഡ്‌മിൻ ആക്കുക", "Make admin")}
                        </button>
                      )}
                      <button
                        onClick={() => setRemoveTarget(member)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-destructive/25 px-3.5 py-2 text-[12.5px] text-destructive transition-colors hover:bg-destructive/10 sm:ml-auto sm:w-auto"
                      >
                        <UserMinus className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {t("അംഗത്തെ നീക്കം ചെയ്യുക", "Remove member")}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
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
      <RoleChangeDialog
        target={roleTarget}
        open={!!roleTarget}
        onOpenChange={(next) => !next && setRoleTarget(null)}
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
      return toast.error(t("ഈ ഇമെയിൽ ഇതിനകം അംഗമാണ്", "This email is already a member"));
    }
    setBusy(true);
    try {
      await base44.users.inviteUser(email, "user");
      await inviteMember({ data: { email, full_name: name } });
      toast.success(t("ക്ഷണം അയച്ചു — എല്ലാ അംഗങ്ങളോടും അംഗീകാരം ചോദിക്കും", "Invite sent — every member will be asked to approve"));
      setForm({ email: "", full_name: "" });
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("ക്ഷണം അയയ്ക്കാനായില്ല", "Couldn't send the invite"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">{t("അംഗത്തെ ക്ഷണിക്കുക", "Invite a member")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <p className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.04] px-3 py-2.5 font-mal text-[12.5px] leading-relaxed text-primary/90">
            {t("നിയമം 9 — പുതിയ അംഗത്തെ ചേർക്കാൻ എല്ലാ അംഗങ്ങളുടെയും അംഗീകാരം വേണം.", "Rule 9 — adding a new member needs every member's approval. No access until then.")}
          </p>
          <Field label={t("പേര്", "Name")}>
            <Input value={form.full_name} onChange={(event) => setForm((p) => ({ ...p, full_name: event.target.value }))} />
          </Field>
          <Field label={t("ഇമെയിൽ", "Email")}>
            <Input type="email" value={form.email} onChange={(event) => setForm((p) => ({ ...p, email: event.target.value }))} />
          </Field>
          <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ക്ഷണം അയയ്ക്കുക", "Send invite")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoleChangeDialog({ target, open, onOpenChange, onDone }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const member = target?.member;
  const promote = target?.role === "super_admin";

  const submit = async () => {
    if (!member) return;
    setBusy(true);
    try {
      await setMemberRole({ data: { member_id: member.id, fund_role: target.role } });
      toast.success(promote ? t("അഡ്‌മിൻ ആക്കി", "Made admin") : t("അഡ്‌മിൻ നീക്കം ചെയ്തു", "Admin role removed"));
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("റോൾ മാറ്റാനായില്ല", "Could not change role"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">
            {promote ? t("അഡ്‌മിൻ ആക്കുക", "Make admin") : t("അഡ്‌മിൻ നീക്കം ചെയ്യുക", "Remove admin")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <p
            className={`rounded-xl border px-3 py-2.5 font-mal text-[12.5px] leading-relaxed ${
              promote ? "border-primary/25 bg-primary/[0.04] text-primary/90" : "border-amber-500/30 bg-amber-500/[0.06] text-amber-800"
            }`}
          >
            {promote
              ? t(
                  "ഈ അംഗത്തിന് അഡ്‌മിൻ അനുമതികൾ ലഭിക്കും — പേയ്‌മെന്റുകളും അഭ്യർത്ഥനകളും പരിശോധിക്കാനും അംഗങ്ങളെ കൈകാര്യം ചെയ്യാനും കഴിയും.",
                  "This member will get admin rights — they can verify payments, approve requests and manage members."
                )
              : t(
                  "ഈ അംഗത്തിന്റെ അഡ്‌മിൻ അനുമതികൾ നീക്കം ചെയ്യും; സാധാരണ അംഗമായി തുടരും.",
                  "This member will lose admin rights and stay on as a regular member."
                )}
          </p>
          {member && (
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <p className="break-words font-mal text-[14px]">{member.full_name}</p>
              <p className="mt-0.5 break-all text-[12px] text-muted-foreground">{member.user_email}</p>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="w-full rounded-full py-5 text-[14px]">
              {t("റദ്ദാക്കുക", "Cancel")}
            </Button>
            <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : promote ? t("അഡ്‌മിൻ ആക്കുക", "Make admin") : t("നീക്കം ചെയ്യുക", "Remove")}
            </Button>
          </div>
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
      toast.success(t("അംഗത്തെ നീക്കം ചെയ്തു", "Member removed"));
      onOpenChange(false);
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("അംഗത്തെ നീക്കം ചെയ്യാനായില്ല", "Could not remove member"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">
            {t("അംഗത്തെ നീക്കം ചെയ്യുക", "Remove member")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <p className="rounded-xl border border-destructive/25 bg-destructive/[0.05] px-3 py-2.5 font-mal text-[12.5px] leading-relaxed text-destructive">
            {t(
              "ഈ അംഗത്തെ ഗ്രൂപ്പിൽ നിന്ന് നീക്കം ചെയ്യും. പഴയ രേഖകൾ നിലനിൽക്കും.",
              "This member will be removed from the group. Their contribution and loan history stays intact; no new records will be created."
            )}
          </p>
          {member && (
            <div className="rounded-xl border border-border bg-card px-3 py-2.5">
              <p className="break-words font-mal text-[14px]">{member.full_name}</p>
              <p className="mt-0.5 break-all text-[12px] text-muted-foreground">{member.user_email}</p>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="w-full rounded-full py-5 text-[14px]">
              {t("റദ്ദാക്കുക", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={submit} disabled={busy} className="w-full rounded-full py-5 text-[14px]">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("നീക്കം ചെയ്യുക", "Remove")}
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
    if (!target) return toast.error(t("പുതിയ കാഷ് ഹാൻഡ്ലറെ തിരഞ്ഞെടുക്കുക", "Choose the new cash handler"));
    setBusy(true);
    try {
      await recordHandover({
        data: { to_member_id: target, cash_balance: Number(balance) || 0, notes: notes || undefined },
      });
      toast.success(t("കാഷ് ഹാൻഡ്ലർ മാറ്റി", "Cash handler changed"));
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
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">{t("കാഷ് ഹാൻഡ്ലർ മാറ്റം", "Cash handler handover")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3.5">
          <Field label={t("പുതിയ കാഷ് ഹാൻഡ്ലർ", "New cash handler")}>
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
            label={t("കൈമാറുന്ന കാഷ് ബാലൻസ് (₹)", "Cash balance handed over (₹)")}
            hint={`${t("ഇപ്പോഴുള്ള കാഷ് ബാലൻസ്", "Current cash balance")} ${inr(cashBalance)}`}
          >
            <Input type="number" value={balance} onChange={(event) => setBalance(event.target.value)} placeholder={String(Math.round(cashBalance || 0))} />
          </Field>
          <Field label={t("കുറിപ്പ്", "Note")}>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={t("ഹാൻഡോവർ വിശദാംശങ്ങൾ", "Handover details")} />
          </Field>
          <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("ഹാൻഡോവർ രേഖപ്പെടുത്തുക", "Record handover")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MembershipRequests({ requests, voters, me, onDone }) {
  const { t, lang } = useLang();
  const [busy, setBusy] = useState(null);
  const voterIds = new Set(voters.map((m) => m.id));
  const canVote = me?.status === "active";

  const vote = async (member, decision) => {
    setBusy(member.id + decision);
    try {
      const result = await voteMembership({ data: { member_id: member.id, decision } });
      toast.success(
        result.rejected
          ? t("അഭ്യർത്ഥന നിരസിച്ചു", "Request declined")
          : result.approved
            ? t("എല്ലാവരും അംഗീകരിച്ചു — പുതിയ അംഗം ചേർന്നു", "Everyone approved — the new member has joined")
            : t("നിങ്ങളുടെ അംഗീകാരം രേഖപ്പെടുത്തി", "Your approval is recorded")
      );
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("പ്രവർത്തനം പരാജയപ്പെട്ടു", "Action failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section>
      <SectionHeading ml="അംഗത്വ അഭ്യർത്ഥനകൾ" en="Membership requests" />
      <p className={`-mt-2 mb-4 text-[13.5px] leading-relaxed text-muted-foreground ${lang === "en" ? "" : "font-mal"}`}>
        {t(
          "നിയമം 9 — എല്ലാ അംഗങ്ങളും അംഗീകരിച്ചാൽ മാത്രമേ പുതിയ അംഗം ചേരൂ. ഒരാൾ നിരസിച്ചാൽ അഭ്യർത്ഥന റദ്ദാകും.",
          "Rule 9 — a new member joins only when every member approves. One rejection declines the request."
        )}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {requests.map((member) => {
          const votes = (member.join_votes || []).filter((v) => voterIds.has(v.member_id));
          const approvedBy = votes.filter((v) => v.decision === "approve");
          const mine = votes.find((v) => v.member_id === me?.id);
          const waitingFor = voters.filter((m) => !votes.some((v) => v.member_id === m.id));
          const pct = voters.length ? Math.round((approvedBy.length / voters.length) * 100) : 0;
          return (
            <article key={member.id} className="card-soft rounded-2xl border border-amber-200 bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[15.5px] font-semibold">{member.full_name}</p>
                  <p className="break-all text-[13px] text-muted-foreground sm:truncate">{member.user_email}</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {member.requested_by && member.requested_by !== "Self"
                      ? t(`ക്ഷണിച്ചത്: ${member.requested_by}`, `Invited by ${member.requested_by}`)
                      : t("ചേരാൻ അഭ്യർത്ഥിച്ചു", "Asked to join")}
                    {member.requested_date ? ` · ${formatDate(member.requested_date)}` : ""}
                  </p>
                </div>
                <div className="shrink-0 self-start">
                  <StatusPill tone="partial">{t("വോട്ടിംഗ്", "Voting")}</StatusPill>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="font-medium">
                    {t(`${approvedBy.length} / ${voters.length} അംഗീകാരം`, `${approvedBy.length} of ${voters.length} approved`)}
                  </span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </div>
                {approvedBy.length > 0 && (
                  <p className="mt-2 break-words text-[12.5px] text-muted-foreground">
                    {t("അംഗീകരിച്ചത്", "Approved by")}: {approvedBy.map((v) => v.member_name).join(", ")}
                  </p>
                )}
                {waitingFor.length > 0 && (
                  <p className="mt-1 break-words text-[12.5px] text-muted-foreground">
                    {t("കാത്തിരിക്കുന്നത്", "Waiting for")}: {waitingFor.map((m) => m.full_name).join(", ")}
                  </p>
                )}
              </div>

              {canVote && (
                <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap sm:items-center">
                  {mine ? (
                    <span className="text-[13px] text-muted-foreground">{t("നിങ്ങൾ അംഗീകരിച്ചു ✓", "You approved ✓")}</span>
                  ) : (
                    <>
                      <button
                        onClick={() => vote(member, "approve")}
                        disabled={!!busy}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
                      >
                        {busy === member.id + "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={2.2} />}
                        {t("അംഗീകരിക്കുക", "Approve")}
                      </button>
                      <button
                        onClick={() => vote(member, "reject")}
                        disabled={!!busy}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full border border-destructive/30 px-4 py-2 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60 sm:w-auto"
                      >
                        {busy === member.id + "reject" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" strokeWidth={2.2} />}
                        {t("നിരസിക്കുക", "Reject")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
