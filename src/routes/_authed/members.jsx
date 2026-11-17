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

      {pending.length > 0 && (
        <MembershipRequests requests={pending} voters={active} me={myMember} onDone={() => fund.reload()} />
      )}

      <section>
        <SectionHeading ml="ഗ്രൂപ്പ് അംഗങ്ങൾ" en="Group members" />
        {active.length === 0 ? (
          <EmptyState icon={Users} ml="അംഗങ്ങൾ ഇല്ല" en="No active members yet" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.map((member) => {
              const isMe = member.user_email === myMember?.user_email;
              const outstanding = outstandingBy(member.user_email);
              const initial = (member.full_name || "?").trim().charAt(0).toUpperCase();
              return (
                <article
                  key={member.id}
                  className={`flex flex-col rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md ${
                    isMe ? "border-primary/40 ring-1 ring-primary/15" : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-[17px] font-semibold text-primary">
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-mal text-[15.5px] font-semibold">{member.full_name}</p>
                        {isMe && (
                          <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                            {t("നിങ്ങൾ", "You")}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground" title={member.user_email}>
                        {member.user_email}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <StatusPill tone={member.fund_role === "super_admin" ? "accent" : member.fund_role === "cash_handler" ? "partial" : "neutral"}>
                        {t(ROLE_LABEL[member.fund_role]?.ml, ROLE_LABEL[member.fund_role]?.en)}
                      </StatusPill>
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                      <dt className="font-mal text-[12px] text-muted-foreground">{t("സംഭാവന", "Contributed")}</dt>
                      <dd className="tnum mt-1 text-[15px] font-semibold text-emerald-700">{inr(contributedBy(member.id))}</dd>
                    </div>
                    <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                      <dt className="font-mal text-[12px] text-muted-foreground">{t("ബാക്കി", "Outstanding")}</dt>
                      <dd className={`tnum mt-1 text-[15px] font-semibold ${outstanding > 0 ? "text-red-600" : "text-foreground"}`}>
                        {inr(outstanding)}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                      <dt className="font-mal text-[12px] text-muted-foreground">{t("ചേർന്നത്", "Joined")}</dt>
                      <dd className="mt-1 text-[13.5px] font-medium">{member.join_date ? formatDate(member.join_date) : "—"}</dd>
                    </div>
                  </dl>

                  {member.fund_role === "super_admin" && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-primary/15 bg-accent/60 px-3.5 py-3">
                      <ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.9} />
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-primary">{t("പൂർണ്ണ അധികാരം", "Full access")}</p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                          {t(
                            "അംഗങ്ങളെ ചേർക്കാനും ഒഴിവാക്കാനും, പേയ്‌മെന്റുകളും ഫണ്ട് അഭ്യർത്ഥനകളും അംഗീകരിക്കാനും, ഫണ്ട് ക്രമീകരണങ്ങളും സൈക്കിളും നിയന്ത്രിക്കാനും കഴിയും.",
                            "Can add and remove members, approve payments and fund requests, and manage fund settings and cycles."
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Spacer: keeps the action row pinned to the card's bottom when row heights differ. */}
                  {isAdmin && !isMe && <div aria-hidden="true" className="min-h-[1rem] flex-1" />}
                  {isAdmin && !isMe && (
                    <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
                      {member.fund_role === "super_admin" ? (
                        <button
                          onClick={() => changeRole(member, "member")}
                          className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[12.5px] text-foreground/80 transition-colors hover:bg-secondary"
                        >
                          <ShieldOff className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {t("അഡ്മിൻ പദവി ഒഴിവാക്കുക", "Remove admin")}
                        </button>
                      ) : (
                        <button
                          onClick={() => changeRole(member, "super_admin")}
                          className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-[12.5px] text-primary transition-colors hover:bg-primary/10"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
                          {t("അഡ്മിൻ ആക്കുക", "Make admin")}
                        </button>
                      )}
                      <button
                        onClick={() => setRemoveTarget(member)}
                        className="ml-auto flex items-center gap-1.5 rounded-full border border-destructive/25 px-3.5 py-1.5 text-[12.5px] text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <UserMinus className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {t("അംഗത്തെ ഒഴിവാക്കുക", "Remove member")}
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
      return toast.error(t("ഈ ഇമെയിൽ ഇതിനകം ഒരു അംഗമാണ്", "This email is already a member"));
    }
    setBusy(true);
    try {
      await base44.users.inviteUser(email, "user");
      // Creates (or re-opens) the pending request; every active member is asked to vote.
      await inviteMember({ data: { email, full_name: name } });
      toast.success(t("ക്ഷണം അയച്ചു — എല്ലാ അംഗങ്ങളും അനുമതി നൽകിയാൽ പ്രവേശനം", "Invite sent — every member will be asked to approve"));
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
      toast.success(promote ? t("അഡ്മിൻ ആക്കി", "Made admin") : t("അഡ്മിൻ പദവി ഒഴിവാക്കി", "Admin role removed"));
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
      <DialogContent className="rounded-[1.4rem] border-border bg-background sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-mal text-[1.05rem] font-normal">
            {promote ? t("അഡ്മിൻ ആക്കുക", "Make admin") : t("അഡ്മിൻ പദവി ഒഴിവാക്കുക", "Remove admin")}
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
                  "ഈ അംഗത്തിന് അഡ്മിൻ അധികാരങ്ങൾ ലഭിക്കും — പേയ്‌മെന്റുകൾ സ്ഥിരീകരിക്കാനും അഭ്യർത്ഥനകൾ അനുവദിക്കാനും അംഗങ്ങളെ നിയന്ത്രിക്കാനും കഴിയും.",
                  "This member will get admin rights — they can verify payments, approve requests and manage members."
                )
              : t(
                  "ഈ അംഗത്തിന്റെ അഡ്മിൻ അധികാരങ്ങൾ ഒഴിവാക്കും. അവർ സാധാരണ അംഗമായി തുടരും.",
                  "This member will lose admin rights and stay on as a regular member."
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
            <Button onClick={submit} disabled={busy} className="w-full rounded-full bg-primary py-5 text-[14px] text-primary-foreground">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : promote ? t("അഡ്മിൻ ആക്കുക", "Make admin") : t("ഒഴിവാക്കുക", "Remove")}
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
// Rule 9: every active member approves a new member; a single rejection declines the request.
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
            ? t("എല്ലാവരും അനുമതി നൽകി — പുതിയ അംഗം ചേർന്നു", "Everyone approved — the new member has joined")
            : t("നിങ്ങളുടെ അനുമതി രേഖപ്പെടുത്തി", "Your approval is recorded")
      );
      onDone?.();
    } catch (error) {
      toast.error(error?.message || t("നടപടി പരാജയപ്പെട്ടു", "Action failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section>
      <SectionHeading ml="അംഗത്വ അഭ്യർത്ഥനകൾ" en="Membership requests" />
      <p className={`-mt-2 mb-4 text-[13.5px] text-muted-foreground ${lang === "en" ? "" : "font-mal"}`}>
        {t(
          "നിയമം 9 — എല്ലാ അംഗങ്ങളും അനുമതി നൽകിയാൽ മാത്രം പുതിയ അംഗം ചേരും. ഒരാൾ നിരസിച്ചാൽ അഭ്യർത്ഥന റദ്ദാകും.",
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
            <article key={member.id} className="card-soft rounded-2xl border border-amber-200 bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15.5px] font-semibold">{member.full_name}</p>
                  <p className="truncate text-[13px] text-muted-foreground">{member.user_email}</p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {member.requested_by && member.requested_by !== "Self"
                      ? t(`ക്ഷണിച്ചത്: ${member.requested_by}`, `Invited by ${member.requested_by}`)
                      : t("സ്വയം അപേക്ഷിച്ചു", "Asked to join")}
                    {member.requested_date ? ` · ${formatDate(member.requested_date)}` : ""}
                  </p>
                </div>
                <StatusPill tone="partial">{t("വോട്ടെടുപ്പിൽ", "Voting")}</StatusPill>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium">
                    {t(`${approvedBy.length} / ${voters.length} അനുമതി`, `${approvedBy.length} of ${voters.length} approved`)}
                  </span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </div>
                {approvedBy.length > 0 && (
                  <p className="mt-2 text-[12.5px] text-muted-foreground">
                    {t("അനുമതി നൽകിയവർ", "Approved by")}: {approvedBy.map((v) => v.member_name).join(", ")}
                  </p>
                )}
                {waitingFor.length > 0 && (
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {t("കാത്തിരിക്കുന്നു", "Waiting for")}: {waitingFor.map((m) => m.full_name).join(", ")}
                  </p>
                )}
              </div>

              {canVote && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
                  {mine ? (
                    <span className="text-[13px] text-muted-foreground">{t("നിങ്ങൾ അനുമതി നൽകി ✓", "You approved ✓")}</span>
                  ) : (
                    <>
                      <button
                        onClick={() => vote(member, "approve")}
                        disabled={!!busy}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {busy === member.id + "approve" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={2.2} />}
                        {t("അനുമതി നൽകുക", "Approve")}
                      </button>
                      <button
                        onClick={() => vote(member, "reject")}
                        disabled={!!busy}
                        className="flex items-center gap-1.5 rounded-full border border-destructive/30 px-4 py-2 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
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
