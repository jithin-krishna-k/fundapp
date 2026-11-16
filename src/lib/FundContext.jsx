import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ensureMember } from "@/lib/server-fns";
import { useAuth } from "@/lib/AuthContext";
import { isoDate, startOfWeek } from "@/lib/format";
import { borrowingInterest } from "@/lib/finance";

const FundContext = createContext(null);
export const useFund = () => useContext(FundContext);

const asArray = (res) => (!res ? [] : Array.isArray(res) ? res : res.items || []);

export function FundProvider({ children }) {
  const { user, isLoadingAuth } = useAuth();
  const [data, setData] = useState({ loading: true, error: null });

  const load = useCallback(async () => {
    if (!user?.email) return;
    try {
      const boot = await ensureMember();
      const [membersRes, contribRes, txnRes, wdRes, emRes, exRes, distRes, notifRes, handRes, rulesRes, propRes] =
        await Promise.all([
          base44.entities.Member.list({ sort: "full_name", limit: 300 }),
          base44.entities.Contribution.list({ sort: "-week_start", limit: 1000 }),
          base44.entities.Transaction.list({ sort: "-created_date", limit: 1000 }),
          base44.entities.Withdrawal.list({ sort: "-created_date", limit: 300 }),
          base44.entities.Emergency.list({ sort: "-created_date", limit: 200 }),
          base44.entities.Expense.list({ sort: "-created_date", limit: 300 }),
          base44.entities.InterestDistribution.list({ sort: "-created_date", limit: 100 }),
          base44.entities.Notification.list({ sort: "-created_date", limit: 200 }),
          base44.entities.CashHandover.list({ sort: "-created_date", limit: 100 }),
          base44.entities.FundRule.list({ sort: "number", limit: 200 }),
          base44.entities.RuleProposal.list({ sort: "-created_date", limit: 100 }),
        ]);

      const members = asArray(membersRes);
      const myEmail = String(user.email || "").trim().toLowerCase();
      const myMember =
        members.find((m) => String(m.user_email || "").trim().toLowerCase() === myEmail) || boot.member;
      const isAdmin = user.role === "admin" || myMember?.fund_role === "super_admin";
      const isHandler = isAdmin || myMember?.fund_role === "cash_handler";

      const contributions = asArray(contribRes);
      const transactions = asArray(txnRes);
      const withdrawals = asArray(wdRes);
      const verified = transactions.filter((t) => t.status === "verified");

      let balance = 0;
      let contributionsTotal = 0;
      let lent = 0;
      let interestCollected = 0;
      let distributed = 0;
      let cashIn = 0;
      let cashOut = 0;
      for (const t of verified) {
        const amount = Number(t.amount) || 0;
        balance += t.direction === "out" ? -amount : amount;
        if (t.category === "weekly_contribution") contributionsTotal += amount;
        if (t.category === "fund_withdrawal") lent += amount;
        if (t.category === "late_interest" || t.category === "borrowing_interest") interestCollected += amount;
        if (t.category === "interest_distribution") distributed += amount;
        if (t.method === "cash") {
          if (t.direction === "in") cashIn += amount;
          else cashOut += amount;
        }
      }

      let outstanding = 0;
      for (const w of withdrawals) {
        if (!["approved", "disbursed"].includes(w.status)) continue;
        const { total } = borrowingInterest(w, boot.settings);
        outstanding += Math.max(0, total - Number(w.amount_paid || 0));
      }

      const weekStart = isoDate(startOfWeek(new Date()));
      const weekContributions = contributions
        .filter((c) => c.week_start === weekStart)
        .sort((a, b) => (a.member_name || "").localeCompare(b.member_name || ""));

      setData({
        loading: false,
        error: null,
        settings: boot.settings,
        cycle: boot.cycle,
        members,
        myMember,
        isAdmin,
        isHandler,
        contributions,
        transactions,
        withdrawals,
        emergencies: asArray(emRes),
        expenses: asArray(exRes),
        distributions: asArray(distRes),
        notifications: asArray(notifRes).filter((n) => n.user_email === user.email),
        handovers: asArray(handRes),
        rules: asArray(rulesRes),
        proposals: asArray(propRes),
        weekStart,
        weekContributions,
        summary: {
          balance,
          contributionsTotal,
          lent,
          interestCollected,
          distributed,
          outstanding,
          members: members.filter((m) => m.status === "active").length,
          cashBalance: cashIn - cashOut,
        },
      });
    } catch (error) {
      setData({ loading: false, error: error?.message || "ഡാറ്റ ലോഡ് ചെയ്യാനായില്ല" });
    }
  }, [user?.email]);

  useEffect(() => {
    if (!isLoadingAuth && user?.email) load();
  }, [isLoadingAuth, user?.email, load]);

  const value = useMemo(() => ({ ...data, reload: load }), [data, load]);

  return <FundContext.Provider value={value}>{children}</FundContext.Provider>;
}