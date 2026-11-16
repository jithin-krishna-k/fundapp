import { inr } from "@/lib/format";
import { borrowingInterest, lateInterest } from "@/lib/finance";

const sum = (rows, key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);

function monthKey(date) {
  return date ? String(date).slice(0, 7) : "—";
}

export function buildReports(fund) {
  const { contributions, transactions, withdrawals, expenses, distributions, members, settings, summary, cycle } = fund;
  const verified = transactions.filter((t) => t.status === "verified");

  /* weekly collection */
  const weekMap = new Map();
  for (const row of contributions) {
    const entry = weekMap.get(row.week_start) || { week: row.week_start, due: 0, collected: 0, paid: 0, members: 0 };
    entry.due += Number(row.amount_due || 0);
    entry.collected += Number(row.amount_paid || 0);
    entry.members += 1;
    if (row.status === "paid") entry.paid += 1;
    weekMap.set(row.week_start, entry);
  }
  const weekly = {
    title: "ആഴ്ച ശേഖരണ റിപ്പോർട്ട്",
    en: "Weekly collection report",
    columns: ["Week", "Members", "Paid", "Due", "Collected", "Pending"],
    rows: Array.from(weekMap.values())
      .sort((a, b) => (a.week < b.week ? 1 : -1))
      .map((row) => [row.week, row.members, row.paid, inr(row.due), inr(row.collected), inr(row.due - row.collected)]),
  };

  /* monthly collection */
  const monthMap = new Map();
  for (const t of verified.filter((x) => x.category === "weekly_contribution")) {
    const key = monthKey(t.txn_date);
    monthMap.set(key, (monthMap.get(key) || 0) + Number(t.amount || 0));
  }
  const monthly = {
    title: "മാസ ശേഖരണ റിപ്പോർട്ട്",
    en: "Monthly collection report",
    columns: ["Month", "Collected"],
    rows: Array.from(monthMap.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([month, amount]) => [month, inr(amount)]),
  };

  /* member contribution */
  const memberContribution = {
    title: "അംഗ സംഭാവന റിപ്പോർട്ട്",
    en: "Member contribution report",
    columns: ["Member", "Weeks paid", "Contributed", "Pending weeks", "Outstanding loans"],
    rows: members
      .filter((m) => m.status === "active")
      .map((m) => {
        const mine = contributions.filter((c) => c.member_id === m.id);
        const loans = withdrawals.filter((w) => w.member_email === m.user_email && ["approved", "disbursed"].includes(w.status));
        const outstanding = loans.reduce(
          (total, w) => total + Math.max(0, Number(w.amount) + borrowingInterest(w, settings).interest - Number(w.amount_paid || 0)),
          0
        );
        return [
          m.full_name,
          mine.filter((c) => c.status === "paid").length,
          inr(sum(mine, "amount_paid")),
          mine.filter((c) => c.status !== "paid").length,
          inr(outstanding),
        ];
      }),
  };

  /* loans */
  const loans = {
    title: "വായ്പ റിപ്പോർട്ട്",
    en: "Loan report",
    columns: ["Member", "Amount", "Status", "Interest", "Paid", "Remaining"],
    rows: withdrawals.map((w) => {
      const interest = borrowingInterest(w, settings).interest;
      const remaining = Math.max(0, Number(w.amount) + interest - Number(w.amount_paid || 0));
      return [w.member_name, inr(w.amount), w.status, inr(interest), inr(w.amount_paid || 0), inr(remaining)];
    }),
  };

  /* outstanding */
  const outstanding = {
    title: "ബാക്കി തുക റിപ്പോർട്ട്",
    en: "Outstanding payment report",
    columns: ["Member", "Type", "Reference", "Amount", "Late interest"],
    rows: [
      ...contributions
        .filter((c) => c.status !== "paid")
        .map((c) => [
          c.member_name,
          "Weekly contribution",
          c.week_start,
          inr(Number(c.amount_due) - Number(c.amount_paid || 0)),
          inr(lateInterest(c, settings).interest),
        ]),
      ...withdrawals
        .filter((w) => ["approved", "disbursed"].includes(w.status))
        .map((w) => [
          w.member_name,
          "Loan",
          w.purpose || "—",
          inr(Math.max(0, Number(w.amount) + borrowingInterest(w, settings).interest - Number(w.amount_paid || 0))),
          "—",
        ]),
    ],
  };

  /* interest collected */
  const interestCollection = {
    title: "പലിശ ശേഖരണ റിപ്പോർട്ട്",
    en: "Interest collection report",
    columns: ["Date", "Member", "Type", "Amount"],
    rows: verified
      .filter((t) => ["late_interest", "borrowing_interest"].includes(t.category))
      .map((t) => [t.txn_date, t.member_name || "—", t.category === "late_interest" ? "Late payment" : "Borrowing", inr(t.amount)]),
  };

  /* interest distribution */
  const interestDistribution = {
    title: "പലിശ വിതരണ റിപ്പോർട്ട്",
    en: "Interest distribution report",
    columns: ["Date", "Members", "Per member", "Total"],
    rows: distributions.map((d) => [d.distributed_date, d.member_count, inr(d.per_member), inr(d.total_amount)]),
  };

  /* expenses */
  const expenseReport = {
    title: "ചെലവ് റിപ്പോർട്ട്",
    en: "Fund expenses report",
    columns: ["Date", "Category", "Description", "Amount", "Status"],
    rows: expenses.map((e) => [e.expense_date, e.category, e.description, inr(e.amount), e.status]),
  };

  /* cash flow */
  let running = 0;
  const cashFlow = {
    title: "ക്യാഷ് ഫ്ലോ റിപ്പോർട്ട്",
    en: "Cash flow report",
    columns: ["Date", "Ref", "Category", "In", "Out", "Balance"],
    rows: verified
      .slice()
      .sort((a, b) => String(a.txn_date).localeCompare(String(b.txn_date)))
      .map((t) => {
        running += t.direction === "out" ? -Number(t.amount || 0) : Number(t.amount || 0);
        return [
          t.txn_date,
          t.ref,
          t.category,
          t.direction === "in" ? inr(t.amount) : "—",
          t.direction === "out" ? inr(t.amount) : "—",
          inr(running),
        ];
      }),
  };

  /* full cycle */
  const cycleReport = {
    title: "പൂർണ്ണ സൈക്കിൾ റിപ്പോർട്ട്",
    en: "Complete fund cycle report",
    columns: ["Item", "Value"],
    rows: [
      ["Cycle", cycle?.name || "—"],
      ["Start date", cycle?.start_date || "—"],
      ["Status", cycle?.status || "—"],
      ["Total contributions", inr(summary.contributionsTotal)],
      ["Total lent", inr(summary.lent)],
      ["Total outstanding", inr(summary.outstanding)],
      ["Interest collected", inr(summary.interestCollected)],
      ["Interest distributed", inr(summary.distributed)],
      ["Expenses", inr(sum(expenses.filter((e) => e.status === "approved"), "amount"))],
      ["Members", summary.members],
      ["Fund balance", inr(summary.balance)],
    ],
  };

  return {
    weekly,
    monthly,
    member: memberContribution,
    loans,
    outstanding,
    interestCollection,
    interestDistribution,
    expenses: expenseReport,
    cashFlow,
    cycle: cycleReport,
  };
}