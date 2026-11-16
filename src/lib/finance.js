import { weeksBetween } from "@/lib/format";

/** Late-contribution interest, per the group rule:
 *  first 2 weeks after the missed payment → no interest;
 *  from the 3rd week → ₹10 per overdue week. */
export function lateInterest(contribution, settings) {
  const perWeek = Number(settings?.late_interest_per_week ?? 10);
  const graceWeeks = Number(settings?.late_interest_grace_weeks ?? 2);
  if (!contribution || contribution.status === "paid") return { lateWeeks: 0, interest: 0 };
  const lateWeeks = weeksBetween(contribution.due_date, new Date());
  const chargeable = Math.max(0, lateWeeks - graceWeeks);
  return { lateWeeks, interest: chargeable * perWeek };
}

/** Borrowing interest, per the group rule:
 *  repaid in the same week → no interest; from the second week → 1%.
 *  `mode` is admin-configurable: once (flat, charged a single time) or
 *  weekly (1% for every week the loan stays open). */
export function borrowingInterest(withdrawal, settings) {
  const percent = Number(withdrawal?.interest_percent ?? settings?.borrowing_interest_percent ?? 1);
  const mode = withdrawal?.interest_mode || settings?.borrowing_interest_mode || "flat";
  const principal = Number(withdrawal?.amount || 0);
  if (!withdrawal) return { weeks: 0, interest: 0, total: principal };
  const start = withdrawal.disbursed_date || withdrawal.approved_date || withdrawal.request_date;
  const end = withdrawal.repaid_date || new Date();
  const weeks = Math.max(0, weeksBetween(start, end));
  const chargeableWeeks = weeks >= 1 ? (mode === "weekly" ? weeks : 1) : 0;
  const interest = Math.round(principal * (percent / 100) * chargeableWeeks * 100) / 100;
  return { weeks, chargeableWeeks, interest, total: principal + interest, mode, percent };
}

export function loanSummary(withdrawal, settings) {
  const { interest, total, mode, percent } = borrowingInterest(withdrawal, settings);
  const paid = Number(withdrawal?.amount_paid || 0);
  return {
    principal: Number(withdrawal?.amount || 0),
    interest,
    total,
    paid,
    remaining: Math.max(0, total - paid),
    mode,
    percent,
  };
}

export const CONTRIBUTION_STATUS = {
  paid: { ml: "അടച്ചു", en: "Paid" },
  pending: { ml: "ബാക്കി", en: "Pending" },
  overdue: { ml: "കാലതാമസം", en: "Overdue" },
  partial: { ml: "ഭാഗികം", en: "Partially paid" },
};

export const CATEGORY = {
  weekly_contribution: { ml: "ആഴ്ച സംഭാവന", en: "Weekly contribution" },
  fund_withdrawal: { ml: "ഫണ്ട് വായ്പ", en: "Fund withdrawal" },
  loan_repayment: { ml: "വായ്പ തിരിച്ചടവ്", en: "Loan repayment" },
  late_interest: { ml: "കാലതാമസ പലിശ", en: "Late payment interest" },
  borrowing_interest: { ml: "വായ്പ പലിശ", en: "Borrowing interest" },
  fund_expense: { ml: "ഫണ്ട് ചെലവ്", en: "Fund expense" },
  interest_distribution: { ml: "പലിശ വിതരണം", en: "Interest distribution" },
  other: { ml: "മറ്റുള്ളവ", en: "Other approved" },
};

export const REQUEST_STATUS = {
  submitted: { ml: "സമർപ്പിച്ചു", en: "Submitted" },
  under_review: { ml: "പരിശോധനയിൽ", en: "Under review" },
  approved: { ml: "അനുമതി", en: "Approved" },
  rejected: { ml: "നിരസിച്ചു", en: "Rejected" },
  disbursed: { ml: "നൽകി", en: "Disbursed" },
  repaid: { ml: "തിരിച്ചടച്ചു", en: "Repaid" },
};