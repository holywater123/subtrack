// Forward-looking "how much can I safely spend per day for the rest of the
// month" figure, plus a traffic-light status - the whole point is to make
// the cost of spending visible *before* you spend it, not after a
// statement shows up. "Safe" is relative to how the user actually spends
// (avgDailyPace), not an arbitrary fixed number.

export type SafeLimitStatus = "green" | "yellow" | "red" | "no-income";

export interface DailySafeLimitResult {
  status: SafeLimitStatus;
  dailyLimit: number; // can be negative if already over budget
  remainingBudget: number; // income - spentSoFar - upcomingObligations
  remainingDays: number;
  avgDailyPace: number; // spentSoFar / days elapsed so far (excluding today)
  usedEstimatedIncome: boolean; // true if incomeThisMonth was 0 and last month's was substituted
}

export function computeDailySafeLimit({
  incomeThisMonth,
  incomeLastMonth,
  spentSoFar,
  upcomingObligations,
  today,
}: {
  incomeThisMonth: number;
  incomeLastMonth: number;
  spentSoFar: number;
  upcomingObligations: number;
  today: Date;
}): DailySafeLimitResult {
  const usedEstimatedIncome = incomeThisMonth === 0 && incomeLastMonth > 0;
  const income = usedEstimatedIncome ? incomeLastMonth : incomeThisMonth;

  if (income === 0) {
    return {
      status: "no-income",
      dailyLimit: 0,
      remainingBudget: 0,
      remainingDays: 0,
      avgDailyPace: 0,
      usedEstimatedIncome,
    };
  }

  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const remainingDays = Math.max(daysInMonth - dayOfMonth + 1, 1);
  const remainingBudget = income - spentSoFar - upcomingObligations;
  const dailyLimit = remainingBudget / remainingDays;
  const avgDailyPace = spentSoFar / Math.max(dayOfMonth - 1, 1);

  let status: SafeLimitStatus;
  if (remainingBudget < 0) {
    status = "red";
  } else {
    const ratio = avgDailyPace === 0 ? 2 : dailyLimit / avgDailyPace;
    status = ratio >= 1 ? "green" : ratio >= 0.5 ? "yellow" : "red";
  }

  return {
    status,
    dailyLimit,
    remainingBudget,
    remainingDays,
    avgDailyPace,
    usedEstimatedIncome,
  };
}
