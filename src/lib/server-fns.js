import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { addDays, isoDate, parseDay, weeksBetween } from "@/lib/format";
import { withEnglish } from "@/lib/notification-text";
import { borrowingInterest } from "@/lib/finance";

/* ── helpers ─────────────────────────────────────────────────────────── */

const asArray = (res) => (!res ? [] : Array.isArray(res) ? res : res.items || []);
const today = () => isoDate(new Date());

function deny(message = "Not allowed") {
  return Object.assign(new Error(message), { status: 403 });
}

// The unique index on Member emails is case-insensitive (lower(data->>'user_email')), so lookups
// must be too: otherwise a signed-in "Jithin@..." never matches a stored "jithin@..." and the
// create path hits app_records_member_email_uniq.
async function findMemberByEmail(b44, email) {
  const wanted = String(email || "").trim();
  if (!wanted) return null;
  const rows = asArray(await b44.entities.Member.filter({ user_email: wanted }));
  if (rows[0]) return rows[0];
  const all = asArray(await b44.entities.Member.list({ limit: 1000 }));
  const needle = wanted.toLowerCase();
  return all.find((m) => String(m.user_email || "").trim().toLowerCase() === needle) || null;
}

async function memberFor(b44, user) {
  return findMemberByEmail(b44, user?.email);
}

const isAdmin = (user, member) => user?.role === "admin" || member?.fund_role === "super_admin";
const isHandler = (user, member) => isAdmin(user, member) || member?.fund_role === "cash_handler";

async function firstSettings(b44) {
  return asArray(await b44.entities.FundSettings.list({ sort: "-created_date", limit: 1 }))[0] || null;
}

async function ensureSettings(b44) {
  const existing = await firstSettings(b44);
  if (existing) return existing;
  return b44.entities.FundSettings.create({
    group_name: "FUND",
    currency: "INR",
    weekly_amount: 250,
    week_start_day: 1,
    late_interest_per_week: 10,
    late_interest_grace_weeks: 2,
    borrowing_interest_percent: 1,
    borrowing_interest_mode: "flat",
    emergency_requires_all: true,
  });
}

async function currentCycle(b44) {
  return asArray(await b44.entities.FundCycle.filter({ status: "active" }))[0] || null;
}

async function ensureCycle(b44) {
  const active = await currentCycle(b44);
  if (active) return active;
  const started = new Date();
  const created = await b44.entities.FundCycle.create({
    name: `FUND ${started.getFullYear()}`,
    start_date: today(),
    proposed_close_date: isoDate(addDays(started, 330)),
    status: "active",
    opened_by: "System",
  });
  const settings = await ensureSettings(b44);
  await b44.entities.FundSettings.update(settings.id, { active_cycle_id: created.id });
  return created;
}

async function activeMembers(b44) {
  return asArray(await b44.entities.Member.filter({ status: "active" }));
}

function ledger(txns) {
  let balance = 0;
  let interest = 0;
  let distributed = 0;
  for (const t of txns || []) {
    if (t.status !== "verified") continue;
    const amount = Number(t.amount) || 0;
    balance += t.direction === "out" ? -amount : amount;
    if (t.category === "late_interest" || t.category === "borrowing_interest") interest += amount;
    if (t.category === "interest_distribution") distributed += amount;
  }
  return { balance, interest, distributed };
}

async function verifiedTxns(b44) {
  return asArray(await b44.entities.Transaction.filter({ status: "verified" }));
}

async function nextRef(b44) {
  const count = await b44.entities.Transaction.count({});
  return `TXN-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, "0")}`;
}

async function audit(b44, actor, action, entity, entity_id, details) {
  await b44.entities.AuditLog.create({ actor, action, entity, entity_id, details });
}

async function notifyAll(b44, members, payload) {
  const rows = (members || [])
    .filter((m) => m?.user_email)
    .map((m) => ({ ...withEnglish(payload), user_email: m.user_email, member_name: m.full_name, read: false }));
  if (rows.length) await b44.entities.Notification.bulkCreate(rows);
}

/* ── membership ──────────────────────────────────────────────────────── */

export const ensureMember = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    const { user } = context;
    const b44 = context.getBase44().asServiceRole;
    const settings = await ensureSettings(b44);
    const cycle = await ensureCycle(b44);

    const existing = await memberFor(b44, user);
    if (existing) {
      if (!existing.user_id && user.id) {
        await b44.entities.Member.update(existing.id, { user_id: user.id });
      }
      return { member: existing, settings, cycle, isFirst: false };
    }

    const count = await b44.entities.Member.count({});
    const bootstrap = count === 0 || user.role === "admin";
    let member;
    try {
      member = await b44.entities.Member.create({
        user_email: user.email,
        user_id: user.id,
        full_name: user.full_name || user.email,
        fund_role: bootstrap ? "super_admin" : "member",
        status: bootstrap ? "active" : "pending",
        join_date: today(),
      });
    } catch (err) {
      // A parallel first load already created this member (unique email index): use that one.
      if (err?.code !== "23505") throw err;
      const raced = await findMemberByEmail(b44, user.email);
      if (!raced) throw err;
      return { member: raced, settings, cycle, isFirst: false };
    }

    if (!bootstrap) {
      const admins = asArray(await b44.entities.Member.filter({ fund_role: "super_admin" }));
      await notifyAll(b44, admins, {
        title: "പുതിയ അംഗ അഭ്യർത്ഥന",
        body: `${member.full_name} അംഗത്വത്തിന് അപേക്ഷിച്ചു. എല്ലാ അംഗങ്ങളുടെയും അനുവാദം ആവശ്യമാണ്.`,
        type: "new_member",
        link: "/members",
      });
    }
    return { member, settings, cycle, isFirst: bootstrap };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ member_id: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isAdmin(user, me)) throw deny("Only the super admin can remove members.");

    const target = await b44.entities.Member.get(data.member_id);
    if (!target) throw Object.assign(new Error("Member not found."), { status: 404 });
    if (target.user_email === user.email) throw Object.assign(new Error("You cannot remove yourself."), { status: 400 });

    if (target.fund_role === "super_admin") {
      const admins = asArray(await b44.entities.Member.filter({ fund_role: "super_admin", status: "active" }));
      if (admins.length <= 1) throw Object.assign(new Error("The last super admin cannot be removed."), { status: 400 });
    }

    const removed = await b44.entities.Member.update(target.id, { status: "inactive", removed_date: today() });
    await audit(b44, user.email, "remove_member", "Member", target.id, target.full_name);
    return { ok: true, member: removed };
  });

/* ── weekly contributions ────────────────────────────────────────────── */

export const generateWeek = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ week_start: z.string().min(8) }))
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const me = await memberFor(b44, context.user);
    if (!isHandler(context.user, me)) throw deny("Only the cash handler or super admin can generate a week.");

    const settings = await ensureSettings(b44);
    const cycle = await ensureCycle(b44);
    const members = await activeMembers(b44);
    const start = parseDay(data.week_start);
    const end = addDays(start, 6);
    const existing = asArray(await b44.entities.Contribution.filter({ week_start: data.week_start }));
    const known = new Set(existing.map((c) => c.member_id));

    const rows = members
      .filter((m) => !known.has(m.id))
      .map((m) => ({
        cycle_id: cycle.id,
        member_id: m.id,
        member_name: m.full_name,
        member_email: m.user_email,
        week_label: `${isoDate(start)} → ${isoDate(end)}`,
        week_start: data.week_start,
        week_end: isoDate(end),
        due_date: isoDate(end),
        amount_due: Number(settings.weekly_amount) || 250,
        amount_paid: 0,
        status: "pending",
      }));

    if (rows.length) await b44.entities.Contribution.bulkCreate(rows);
    await audit(b44, context.user.email, "generate_week", "Contribution", data.week_start, `${rows.length} rows`);
    return { created: rows.length };
  });

export const submitContributionPayment = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      contribution_id: z.string(),
      method: z.enum(["cash", "online"]),
      screenshot_uri: z.string().optional(),
      note: z.string().max(400).optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!me || me.status !== "active") throw deny("Membership not active.");

    const contribution = await b44.entities.Contribution.get(data.contribution_id);
    if (contribution.member_email !== user.email && !isHandler(user, me)) {
      throw deny("You can only pay your own contribution.");
    }
    if (contribution.status === "paid") throw Object.assign(new Error("This week is already settled."), { status: 400 });
    if (data.method === "cash" && !isHandler(user, me)) throw deny("Cash entries are recorded by the cash handler.");
    if (data.method === "online" && !data.screenshot_uri) {
      throw Object.assign(new Error("Payment screenshot is required for online payments."), { status: 400 });
    }

    const pending = asArray(
      await b44.entities.Transaction.filter({ related_id: contribution.id, status: "pending" })
    );
    if (pending.length) throw Object.assign(new Error("A payment for this week is already awaiting verification."), { status: 400 });

    const remaining = Math.max(0, Number(contribution.amount_due) - Number(contribution.amount_paid || 0));
    const verified = data.method === "cash";

    const txn = await b44.entities.Transaction.create({
      ref: await nextRef(b44),
      cycle_id: contribution.cycle_id,
      member_id: contribution.member_id,
      member_name: contribution.member_name,
      category: "weekly_contribution",
      amount: remaining,
      direction: "in",
      method: data.method,
      status: verified ? "verified" : "pending",
      txn_date: today(),
      description: data.note || `Weekly contribution · ${contribution.week_start}`,
      screenshot_url: data.screenshot_uri,
      recorded_by: user.full_name || user.email,
      verified_by: verified ? user.full_name || user.email : undefined,
      verified_date: verified ? today() : undefined,
      related_id: contribution.id,
    });

    if (verified) {
      await b44.entities.Contribution.update(contribution.id, {
        amount_paid: Number(contribution.amount_paid || 0) + remaining,
        status: "paid",
        paid_date: today(),
        method: "cash",
      });
    } else {
      const handlers = asArray(await b44.entities.Member.filter({ fund_role: "cash_handler" }));
      const admins = asArray(await b44.entities.Member.filter({ fund_role: "super_admin" }));
      await notifyAll(b44, [...handlers, ...admins], {
        title: "പുതിയ ഓൺലൈൻ പേയ്‌മെന്റ്",
        body: `${contribution.member_name} ₹${remaining} ഓൺലൈൻ ആയി അയച്ചു. സ്ക്രീൻഷോട്ട് പരിശോധിക്കുക.`,
        type: "verification",
        link: "/transactions",
      });
    }

    await audit(b44, user.email, "contribution_payment", "Contribution", contribution.id, `${data.method} ₹${remaining}`);
    return txn;
  });

export const reviewTransaction = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), action: z.enum(["verify", "reject"]), reason: z.string().max(300).optional() }))
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isHandler(user, me)) throw deny("Only the cash handler or super admin can verify payments.");

    const txn = await b44.entities.Transaction.get(data.id);
    if (txn.status !== "pending") throw Object.assign(new Error("This entry is already handled."), { status: 400 });

    if (data.action === "reject") {
      await b44.entities.Transaction.update(txn.id, {
        status: "rejected",
        verified_by: user.full_name || user.email,
        verified_date: today(),
        rejection_reason: data.reason || "Not verified",
      });
      await audit(b44, user.email, "transaction_rejected", "Transaction", txn.id, data.reason || "");
      return { ok: true };
    }

    await b44.entities.Transaction.update(txn.id, {
      status: "verified",
      verified_by: user.full_name || user.email,
      verified_date: today(),
    });

    if (txn.category === "weekly_contribution" && txn.related_id) {
      const contribution = await b44.entities.Contribution.get(txn.related_id);
      const paid = Number(contribution.amount_paid || 0) + Number(txn.amount || 0);
      await b44.entities.Contribution.update(contribution.id, {
        amount_paid: paid,
        status: paid >= Number(contribution.amount_due) ? "paid" : "partial",
        paid_date: today(),
        method: txn.method,
      });
    }

    if (txn.category === "other" && txn.related_id) {
      try {
        await b44.entities.Expense.update(txn.related_id, {
          status: "approved",
          approved_by: user.full_name || user.email,
          approved_date: today(),
        });
      } catch {
        /* related record optional */
      }
    }

    await audit(b44, user.email, "transaction_verified", "Transaction", txn.id, `₹${txn.amount}`);
    return { ok: true };
  });

/* ── withdrawals ─────────────────────────────────────────────────────── */

export const createWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      amount: z.number().positive(),
      purpose: z.string().min(2).max(200),
      request_date: z.string(),
      expected_repayment_date: z.string(),
      explanation: z.string().max(600).optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!me || me.status !== "active") throw deny("Membership not active.");

    const settings = await ensureSettings(b44);
    const cycle = await ensureCycle(b44);
    const { balance } = ledger(await verifiedTxns(b44));
    if (data.amount > balance) {
      throw Object.assign(new Error("Requested amount is more than the available fund balance."), { status: 400 });
    }

    const created = await b44.entities.Withdrawal.create({
      cycle_id: cycle.id,
      member_id: me.id,
      member_name: me.full_name,
      member_email: me.user_email,
      amount: data.amount,
      purpose: data.purpose,
      request_date: data.request_date,
      expected_repayment_date: data.expected_repayment_date,
      explanation: data.explanation,
      status: "submitted",
      interest_mode: settings.borrowing_interest_mode || "flat",
      interest_percent: Number(settings.borrowing_interest_percent) || 1,
      amount_paid: 0,
      interest_paid: 0,
      available_balance_at_request: balance,
    });

    const admins = asArray(await b44.entities.Member.filter({ fund_role: "super_admin" }));
    await notifyAll(b44, admins, {
      title: "പുതിയ ഫണ്ട് അഭ്യർത്ഥന",
      body: `${me.full_name} ₹${data.amount} ആവശ്യപ്പെട്ടു — ${data.purpose}`,
      type: "request_status",
      link: "/request-fund",
    });
    await audit(b44, user.email, "withdrawal_requested", "Withdrawal", created.id, `₹${data.amount}`);
    return created;
  });

export const decideWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string(),
      action: z.enum(["review", "approve", "reject", "disburse"]),
      note: z.string().max(400).optional(),
      method: z.enum(["cash", "online"]).optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isAdmin(user, me)) throw deny("Only the super admin can decide fund requests.");

    const w = await b44.entities.Withdrawal.get(data.id);
    const { balance } = ledger(await verifiedTxns(b44));

    if (data.action === "review") {
      await b44.entities.Withdrawal.update(w.id, { status: "under_review" });
      return { ok: true };
    }

    if (data.action === "reject") {
      await b44.entities.Withdrawal.update(w.id, {
        status: "rejected",
        decision_note: data.note,
        approved_by: user.full_name || user.email,
        approved_date: today(),
      });
      await audit(b44, user.email, "withdrawal_rejected", "Withdrawal", w.id, data.note || "");
      return { ok: true };
    }

    if (data.action === "approve") {
      if (Number(w.amount) > balance) {
        throw Object.assign(new Error("Available balance is not enough to approve this request."), { status: 400 });
      }
      const settings = await ensureSettings(b44);
      await b44.entities.Withdrawal.update(w.id, {
        status: "approved",
        approved_by: user.full_name || user.email,
        approved_date: today(),
        interest_mode: w.interest_mode || settings.borrowing_interest_mode || "flat",
        interest_percent: Number(w.interest_percent) || Number(settings.borrowing_interest_percent) || 1,
        decision_note: data.note,
      });
      await audit(b44, user.email, "withdrawal_approved", "Withdrawal", w.id, `₹${w.amount}`);
      return { ok: true };
    }

    // disburse
    if (w.status !== "approved") throw Object.assign(new Error("Approve the request before disbursing."), { status: 400 });
    if (Number(w.amount) > balance) throw Object.assign(new Error("Available balance is not enough."), { status: 400 });

    const txn = await b44.entities.Transaction.create({
      ref: await nextRef(b44),
      cycle_id: w.cycle_id,
      member_id: w.member_id,
      member_name: w.member_name,
      category: "fund_withdrawal",
      amount: Number(w.amount),
      direction: "out",
      method: data.method || "cash",
      status: "verified",
      txn_date: today(),
      description: `Loan disbursed · ${w.purpose || ""}`,
      recorded_by: user.full_name || user.email,
      verified_by: user.full_name || user.email,
      verified_date: today(),
      related_id: w.id,
    });

    await b44.entities.Withdrawal.update(w.id, { status: "disbursed", disbursed_date: today() });
    await audit(b44, user.email, "withdrawal_disbursed", "Withdrawal", w.id, `₹${w.amount} (${txn.ref})`);
    return txn;
  });

export const recordRepayment = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      id: z.string(),
      amount: z.number().positive(),
      method: z.enum(["cash", "online"]),
      note: z.string().max(300).optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isHandler(user, me)) throw deny("Only the cash handler or super admin can record repayments.");

    const w = await b44.entities.Withdrawal.get(data.id);
    if (!["approved", "disbursed"].includes(w.status)) {
      throw Object.assign(new Error("This loan is not open for repayment."), { status: 400 });
    }

    const settings = await ensureSettings(b44);
    const { interest: totalInterest } = borrowingInterest(w, settings);
    const interestDue = Math.max(0, totalInterest - Number(w.interest_paid || 0));
    const interestPart = Math.min(data.amount, interestDue);
    const principalPart = Math.round((data.amount - interestPart) * 100) / 100;
    const stamp = user.full_name || user.email;

    if (interestPart > 0) {
      await b44.entities.Transaction.create({
        ref: await nextRef(b44),
        cycle_id: w.cycle_id,
        member_id: w.member_id,
        member_name: w.member_name,
        category: "borrowing_interest",
        amount: interestPart,
        direction: "in",
        method: data.method,
        status: "verified",
        txn_date: today(),
        description: `Borrowing interest · ${w.purpose || "loan"}`,
        recorded_by: stamp,
        verified_by: stamp,
        verified_date: today(),
        related_id: w.id,
      });
    }

    if (principalPart > 0) {
      await b44.entities.Transaction.create({
        ref: await nextRef(b44),
        cycle_id: w.cycle_id,
        member_id: w.member_id,
        member_name: w.member_name,
        category: "loan_repayment",
        amount: principalPart,
        direction: "in",
        method: data.method,
        status: "verified",
        txn_date: today(),
        description: data.note || `Loan repayment · ${w.purpose || ""}`,
        recorded_by: stamp,
        verified_by: stamp,
        verified_date: today(),
        related_id: w.id,
      });
    }

    const amountPaid = Number(w.amount_paid || 0) + data.amount;
    const total = Number(w.amount) + totalInterest;
    const settled = amountPaid >= total - 0.5;

    await b44.entities.Withdrawal.update(w.id, {
      amount_paid: amountPaid,
      interest_paid: Number(w.interest_paid || 0) + interestPart,
      status: settled ? "repaid" : w.status,
      repaid_date: settled ? today() : undefined,
    });

    await audit(b44, user.email, "loan_repayment", "Withdrawal", w.id, `₹${data.amount}`);
    return { ok: true, settled };
  });

/* ── emergency ───────────────────────────────────────────────────────── */

export const createEmergency = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      case_type: z.enum(["hospital", "medical", "urgent"]),
      amount: z.number().positive(),
      description: z.string().min(2).max(800),
      document_url: z.string().optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const me = await memberFor(b44, context.user);
    if (!me || me.status !== "active") throw deny("Membership not active.");
    const cycle = await ensureCycle(b44);
    const members = await activeMembers(b44);

    const created = await b44.entities.Emergency.create({
      cycle_id: cycle.id,
      member_id: me.id,
      member_name: me.full_name,
      member_email: me.user_email,
      case_type: data.case_type,
      amount: data.amount,
      description: data.description,
      document_url: data.document_url,
      status: "open",
      required_approvals: members.length,
      decisions: [],
    });

    await notifyAll(b44, members, {
      title: "അടിയന്തിര അഭ്യർത്ഥന",
      body: `${me.full_name} ₹${data.amount} അടിയന്തിര സഹായം അഭ്യർത്ഥിച്ചു. നിങ്ങളുടെ തീരുമാനം രേഖപ്പെടുത്തുക.`,
      type: "emergency",
      link: "/emergency",
    });
    await audit(b44, context.user.email, "emergency_created", "Emergency", created.id, `₹${data.amount}`);
    return created;
  });

export const voteEmergency = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), decision: z.enum(["approve", "reject"]), comment: z.string().max(300).optional() }))
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const me = await memberFor(b44, context.user);
    if (!me || me.status !== "active") throw deny("Membership not active.");

    const request = await b44.entities.Emergency.get(data.id);
    if (request.status !== "open") throw Object.assign(new Error("This request is already decided."), { status: 400 });

    const decisions = (request.decisions || []).filter((d) => d.member_id !== me.id);
    decisions.push({
      member_id: me.id,
      member_name: me.full_name,
      decision: data.decision,
      comment: data.comment,
      date: today(),
    });

    const members = await activeMembers(b44);
    const approvals = decisions.filter((d) => d.decision === "approve").length;
    const rejections = decisions.filter((d) => d.decision === "reject").length;
    const required = Number(request.required_approvals) || members.length;
    const rejected = rejections > 0;
    const approved = !rejected && approvals >= required;

    await b44.entities.Emergency.update(request.id, {
      decisions,
      status: rejected ? "rejected" : approved ? "approved" : "open",
      decided_date: approved || rejected ? today() : undefined,
    });

    if (rejected) {
      await notifyAll(b44, members, {
        title: "അടിയന്തിര അഭ്യർത്ഥന നിരസിച്ചു",
        body: `${request.member_name} ന്റെ ₹${request.amount} അഭ്യർത്ഥന ഗ്രൂപ്പിന്റെ തീരുമാനപ്രകാരം നിരസിച്ചു.`,
        type: "emergency",
        link: "/emergency",
      });
    }

    if (approved) {
      await notifyAll(b44, members, {
        title: "അടിയന്തിര അഭ്യർത്ഥന അംഗീകരിച്ചു",
        body: `${request.member_name} ന്റെ ₹${request.amount} അടിയന്തിര അഭ്യർത്ഥന എല്ലാവരുടെയും അനുമതിയോടെ അംഗീകരിച്ചു.`,
        type: "emergency",
        link: "/emergency",
      });
    }
    return { ok: true, approvals, required };
  });

/* ── expenses ────────────────────────────────────────────────────────── */

export const createExpense = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      category: z.enum(["stationery", "printing", "travel", "refreshment", "other"]),
      amount: z.number().positive(),
      expense_date: z.string(),
      description: z.string().min(2).max(400),
      receipt_url: z.string().optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const me = await memberFor(b44, context.user);
    if (!isHandler(context.user, me)) throw deny("Only the cash handler or super admin can record expenses.");
    const cycle = await ensureCycle(b44);

    const created = await b44.entities.Expense.create({
      ...data,
      cycle_id: cycle.id,
      status: "pending",
      recorded_by: context.user.full_name || context.user.email,
    });

    const admins = asArray(await b44.entities.Member.filter({ fund_role: "super_admin" }));
    await notifyAll(b44, admins, {
      title: "പുതിയ ചെലവ് അനുമതിക്കായി",
      body: `${data.description} — ₹${data.amount}. അനുമതി നൽകുക.`,
      type: "general",
      link: "/expenses",
    });
    await audit(b44, context.user.email, "expense_created", "Expense", created.id, `₹${data.amount}`);
    return created;
  });

export const decideExpense = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), action: z.enum(["approve", "reject"]), reason: z.string().max(300).optional() }))
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isAdmin(user, me)) throw deny("Only the super admin can approve expenses.");

    const expense = await b44.entities.Expense.get(data.id);
    if (expense.status !== "pending") throw Object.assign(new Error("This expense is already decided."), { status: 400 });

    if (data.action === "reject") {
      await b44.entities.Expense.update(expense.id, {
        status: "rejected",
        approved_by: user.full_name || user.email,
        approved_date: today(),
      });
      return { ok: true };
    }

    const { balance } = ledger(await verifiedTxns(b44));
    if (Number(expense.amount) > balance) {
      throw Object.assign(new Error("Available balance is not enough for this expense."), { status: 400 });
    }

    const txn = await b44.entities.Transaction.create({
      ref: await nextRef(b44),
      cycle_id: expense.cycle_id,
      category: "fund_expense",
      amount: Number(expense.amount),
      direction: "out",
      method: "cash",
      status: "verified",
      txn_date: expense.expense_date || today(),
      description: expense.description,
      receipt_url: expense.receipt_url,
      recorded_by: expense.recorded_by,
      verified_by: user.full_name || user.email,
      verified_date: today(),
      related_id: expense.id,
    });

    await b44.entities.Expense.update(expense.id, {
      status: "approved",
      approved_by: user.full_name || user.email,
      approved_date: today(),
      transaction_id: txn.id,
    });
    await audit(b44, user.email, "expense_approved", "Expense", expense.id, `₹${expense.amount}`);
    return { ok: true };
  });

/* ── interest distribution ───────────────────────────────────────────── */

export const distributeInterest = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ notes: z.string().max(300).optional() }))
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isAdmin(user, me)) throw deny("Only the super admin can distribute interest.");

    const members = await activeMembers(b44);
    if (!members.length) throw Object.assign(new Error("There are no active members yet."), { status: 400 });

    const { interest, distributed } = ledger(await verifiedTxns(b44));
    const available = Math.floor(interest - distributed);
    if (available <= 0) throw Object.assign(new Error("No interest is available to distribute."), { status: 400 });

    const per = Math.floor(available / members.length);
    if (per <= 0) throw Object.assign(new Error("The amount is too small to split."), { status: 400 });
    const total = per * members.length;
    const cycle = await ensureCycle(b44);
    const stamp = user.full_name || user.email;

    const allocations = members.map((m) => ({ member_id: m.id, member_name: m.full_name, amount: per }));

    const distribution = await b44.entities.InterestDistribution.create({
      cycle_id: cycle.id,
      total_amount: total,
      per_member: per,
      member_count: members.length,
      distributed_date: today(),
      status: "completed",
      notes: data.notes,
      initiated_by: stamp,
      allocations,
    });

    await b44.entities.Transaction.bulkCreate(
      members.map((m) => ({
        ref: `INT-${distribution.id.slice(-6).toUpperCase()}`,
        cycle_id: cycle.id,
        member_id: m.id,
        member_name: m.full_name,
        category: "interest_distribution",
        amount: per,
        direction: "out",
        method: "cash",
        status: "verified",
        txn_date: today(),
        description: "Interest distribution",
        recorded_by: stamp,
        verified_by: stamp,
        verified_date: today(),
        related_id: distribution.id,
      }))
    );

    await notifyAll(b44, members, {
      title: "പലിശ വിതരണം",
      body: `₹${per} വീതം എല്ലാ അംഗങ്ങൾക്കും പലിശ വിതരണം ചെയ്തു.`,
      type: "interest_distribution",
      link: "/interest",
    });
    await audit(b44, user.email, "interest_distributed", "InterestDistribution", distribution.id, `₹${total}`);
    return distribution;
  });

/* ── rule amendments ─────────────────────────────────────────────────── */

export const proposeRuleChange = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      rule_number: z.number().int().min(1),
      proposed_text: z.string().min(4).max(800),
      reason: z.string().min(4).max(500),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!me || me.status !== "active") throw deny("Membership not active.");

    const rules = asArray(await b44.entities.FundRule.filter({ number: data.rule_number, active: true }));
    const current = rules[0] || null;
    const members = await activeMembers(b44);

    const proposal = await b44.entities.RuleProposal.create({
      rule_number: data.rule_number,
      current_text: current?.text_ml || "",
      proposed_text: data.proposed_text,
      reason: data.reason,
      status: "open",
      proposed_by: me.full_name,
      proposed_date: today(),
      required_approvals: members.length,
      votes: [
        {
          member_id: me.id,
          member_name: me.full_name,
          decision: "approve",
          date: today(),
        },
      ],
    });

    await notifyAll(b44, members, {
      title: "നിയമ ഭേദഗതി നിർദ്ദേശം",
      body: `നിയമം ${data.rule_number} മാറ്റാൻ നിർദ്ദേശം. അനുമതി നൽകുക.`,
      type: "rule_change",
      link: "/rules",
    });
    await audit(b44, user.email, "rule_proposed", "RuleProposal", proposal.id, `Rule ${data.rule_number}`);
    return proposal;
  });

export const voteRuleChange = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string(), decision: z.enum(["approve", "reject"]) }))
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!me || me.status !== "active") throw deny("Membership not active.");

    const proposal = await b44.entities.RuleProposal.get(data.id);
    if (proposal.status !== "open") throw Object.assign(new Error("This proposal is already decided."), { status: 400 });

    const votes = (proposal.votes || []).filter((v) => v.member_id !== me.id);
    votes.push({ member_id: me.id, member_name: me.full_name, decision: data.decision, date: today() });

    const members = await activeMembers(b44);
    const approvals = votes.filter((v) => v.decision === "approve").length;
    const rejections = votes.filter((v) => v.decision === "reject").length;
    const required = Number(proposal.required_approvals) || members.length;

    if (rejections > 0) {
      await b44.entities.RuleProposal.update(proposal.id, { votes, status: "rejected", decided_date: today() });
      await notifyAll(b44, members, {
        title: "നിയമ ഭേദഗതി നിരസിച്ചു",
        body: `നിയമം ${proposal.rule_number} ഭേദഗതി നിരസിക്കപ്പെട്ടു.`,
        type: "rule_change",
        link: "/rules",
      });
      return { ok: true, status: "rejected" };
    }

    if (approvals < required) {
      await b44.entities.RuleProposal.update(proposal.id, { votes });
      return { ok: true, status: "open", approvals, required };
    }

    // unanimous — apply the amendment
    const previous = asArray(await b44.entities.FundRule.filter({ number: proposal.rule_number, active: true }));
    const version = Math.max(0, ...previous.map((r) => Number(r.version) || 1)) + 1;
    if (previous.length) {
      await b44.entities.FundRule.updateMany({ number: proposal.rule_number, active: true }, { $set: { active: false } });
    }
    await b44.entities.FundRule.create({
      number: proposal.rule_number,
      text_ml: proposal.proposed_text,
      text_en: previous[0]?.text_en || "",
      version,
      active: true,
    });
    await b44.entities.RuleProposal.update(proposal.id, { votes, status: "approved", decided_date: today() });

    await notifyAll(b44, members, {
      title: "നിയമ ഭേദഗതി അംഗീകരിച്ചു",
      body: `നിയമം ${proposal.rule_number} പുതിയ രൂപത്തിൽ പ്രാബല്യത്തിൽ വന്നു.`,
      type: "rule_change",
      link: "/rules",
    });
    await audit(b44, user.email, "rule_amended", "FundRule", String(proposal.rule_number), `v${version}`);
    return { ok: true, status: "approved" };
  });

/* ── fund cycle & cash handler ───────────────────────────────────────── */

export const closeCycle = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ notes: z.string().max(400).optional() }))
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isAdmin(user, me)) throw deny("Only the super admin can close a cycle.");

    const cycle = await currentCycle(b44);
    if (!cycle) throw Object.assign(new Error("There is no active cycle."), { status: 400 });

    const open = asArray(await b44.entities.Withdrawal.filter({ status: { $in: ["approved", "disbursed"] } }));
    if (open.length) {
      throw Object.assign(new Error("Settle outstanding loans before closing the cycle."), { status: 400 });
    }

    const { balance } = ledger(await verifiedTxns(b44));
    const members = await activeMembers(b44);

    await b44.entities.FundCycle.update(cycle.id, {
      status: "closed",
      closed_date: today(),
      closing_balance: balance,
      member_count: members.length,
      notes: data.notes,
    });

    await notifyAll(b44, members, {
      title: "ഫണ്ട് സൈക്കിൾ അവസാനിച്ചു",
      body: `${cycle.name} സൈക്കിൾ അവസാനിച്ചു. അവസാന ബാലൻസ് ₹${balance}.`,
      type: "cycle_closing",
      link: "/settings",
    });
    await audit(b44, user.email, "cycle_closed", "FundCycle", cycle.id, `₹${balance}`);
    return { ok: true, balance };
  });

export const startCycle = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      name: z.string().min(2).max(80),
      start_date: z.string(),
      proposed_close_date: z.string(),
      opening_note: z.string().max(300).optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isAdmin(user, me)) throw deny("Only the super admin can start a cycle.");

    const active = await currentCycle(b44);
    if (active) throw Object.assign(new Error("Close the current cycle first."), { status: 400 });

    const created = await b44.entities.FundCycle.create({
      name: data.name,
      start_date: data.start_date,
      proposed_close_date: data.proposed_close_date,
      status: "active",
      notes: data.opening_note,
      opened_by: user.full_name || user.email,
    });
    const settings = await ensureSettings(b44);
    await b44.entities.FundSettings.update(settings.id, { active_cycle_id: created.id });

    const members = await activeMembers(b44);
    await notifyAll(b44, members, {
      title: "പുതിയ ഫണ്ട് സൈക്കിൾ",
      body: `${data.name} സൈക്കിൾ ആരംഭിച്ചു.`,
      type: "cycle_closing",
      link: "/settings",
    });
    await audit(b44, user.email, "cycle_started", "FundCycle", created.id, data.name);
    return created;
  });

export const recordHandover = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      to_member_id: z.string(),
      cash_balance: z.number().min(0),
      notes: z.string().max(400).optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isAdmin(user, me)) throw deny("Only the super admin can assign the cash handler.");

    const members = await activeMembers(b44);
    const next = members.find((m) => m.id === data.to_member_id);
    if (!next) throw Object.assign(new Error("Choose an active member."), { status: 400 });
    const current = members.find((m) => m.fund_role === "cash_handler");

    for (const m of members) {
      if (m.fund_role === "cash_handler" && m.id !== next.id) {
        await b44.entities.Member.update(m.id, { fund_role: "member" });
      }
    }
    await b44.entities.Member.update(next.id, { fund_role: "cash_handler" });

    const handover = await b44.entities.CashHandover.create({
      from_member_name: current?.full_name || "—",
      to_member_id: next.id,
      to_member_name: next.full_name,
      handover_date: today(),
      cash_balance: data.cash_balance,
      notes: data.notes,
      recorded_by: user.full_name || user.email,
    });

    await notifyAll(b44, members, {
      title: "പുതിയ ക്യാഷ് ഹാൻഡ്ലർ",
      body: `${next.full_name} ഇനി ഫണ്ട് കൈകാര്യം ചെയ്യും.`,
      type: "general",
      link: "/settings",
    });
    await audit(b44, user.email, "handover", "CashHandover", handover.id, next.full_name);
    return handover;
  });

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      member_id: z.string().min(1),
      fund_role: z.enum(["super_admin", "member"]),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isAdmin(user, me)) throw deny("Only an admin can change member roles.");

    const target = await b44.entities.Member.get(data.member_id);
    if (!target) throw Object.assign(new Error("Member not found."), { status: 404 });
    if (target.status !== "active") throw Object.assign(new Error("Only active members can be made admin."), { status: 400 });
    if (target.id === me?.id || target.user_email === user.email) {
      throw Object.assign(new Error("You cannot change your own role."), { status: 400 });
    }
    if (target.fund_role === data.fund_role) return target;

    if (data.fund_role === "member" && target.fund_role === "super_admin") {
      const admins = asArray(await b44.entities.Member.filter({ fund_role: "super_admin", status: "active" }));
      if (admins.length <= 1) throw Object.assign(new Error("The last admin cannot be demoted."), { status: 400 });
    }

    const updated = await b44.entities.Member.update(target.id, { fund_role: data.fund_role });
    await audit(b44, user.email, "role_changed", "Member", target.id, `${target.full_name} → ${data.fund_role}`);
    await notifyAll(b44, [target], {
      title: data.fund_role === "super_admin" ? "നിങ്ങൾ ഇനി അഡ്മിൻ" : "അഡ്മിൻ പദവി മാറ്റി",
      body:
        data.fund_role === "super_admin"
          ? "ഗ്രൂപ്പ് അഡ്മിൻ നിങ്ങളെ അഡ്മിൻ ആക്കി."
          : "ഗ്രൂപ്പ് അഡ്മിൻ നിങ്ങളുടെ അഡ്മിൻ പദവി ഒഴിവാക്കി.",
      type: "general",
      link: "/members",
    });
    return updated;
  });

/* ── settings ────────────────────────────────────────────────────────── */

export const saveFundSettings = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(
    z.object({
      weekly_amount: z.number().positive(),
      week_start_day: z.number().int().min(0).max(6),
      late_interest_per_week: z.number().min(0),
      late_interest_grace_weeks: z.number().min(0),
      borrowing_interest_percent: z.number().min(0),
      borrowing_interest_mode: z.enum(["flat", "weekly"]),
      emergency_requires_all: z.boolean(),
    })
  )
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const user = context.user;
    const me = await memberFor(b44, user);
    if (!isAdmin(user, me)) throw deny("Only the super admin can change fund settings.");

    const settings = await ensureSettings(b44);
    const updated = await b44.entities.FundSettings.update(settings.id, data);
    await audit(b44, user.email, "settings_updated", "FundSettings", settings.id, JSON.stringify(data));
    return updated;
  });

/* ── reminders ───────────────────────────────────────────────────────── */

export const sendContributionReminders = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ week_start: z.string() }))
  .handler(async ({ context, data }) => {
    const b44 = context.getBase44().asServiceRole;
    const me = await memberFor(b44, context.user);
    if (!isHandler(context.user, me)) throw deny("Only the cash handler or super admin can send reminders.");

    const rows = asArray(await b44.entities.Contribution.filter({ week_start: data.week_start }));
    const pending = rows.filter((r) => r.status !== "paid");
    if (pending.length) {
      await b44.entities.Notification.bulkCreate(
        pending.map((r) => withEnglish({
          user_email: r.member_email,
          member_name: r.member_name,
          title: "ആഴ്ച സംഭാവന ബാക്കി",
          body: `${r.week_start} ലെ ₹${r.amount_due} സംഭാവന ഇതുവരെ അടച്ചിട്ടില്ല.`,
          type: "contribution_reminder",
          link: "/contributions",
          read: false,
        }))
      );
    }
    return { sent: pending.length };
  });