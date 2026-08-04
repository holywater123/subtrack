import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import {
  TIERED_ACHIEVEMENTS,
  ONE_OFF_ACHIEVEMENTS,
  type AchievementTier,
  type ProgressUnit,
} from "@/lib/achievement-catalog";

interface UnlockedTier {
  // One-off badges are stored with tier "unlocked", not a real
  // AchievementTier - keep that honest in the type instead of casting it
  // away, since code branching on tier (e.g. the achievements UI's glow
  // color) needs to know "unlocked" isn't bronze/silver/gold.
  tier: AchievementTier | "unlocked";
  unlockedAt: string;
}

// Deliberately no `icon` field - a LucideIcon is a component reference and
// can't cross the server -> client serialization boundary. The client
// component resolves the icon itself from the catalog by `id`, the same way
// budgets-client.tsx resolves category icons client-side.
export interface AchievementView {
  id: string;
  category: string;
  title: string;
  description: string;
  unit?: ProgressUnit;
  tiered: boolean;
  unlocked: boolean;
  unlockedTiers: UnlockedTier[];
  currentValue: number | null;
  nextThreshold: number | null;
}

export interface AchievementsResult {
  achievements: AchievementView[];
  newlyUnlockedKeys: string[];
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function monthsBetweenInclusive(startMonth: string, endMonth: string): string[] {
  const [sy, sm] = startMonth.split("-").map(Number);
  const [ey, em] = endMonth.split("-").map(Number);
  const months: string[] = [];
  let y = sy;
  let m = sm;
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

function longestRun(flags: boolean[]): number {
  let best = 0;
  let current = 0;
  for (const flag of flags) {
    current = flag ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}

function longestDayStreak(days: Set<string>): number {
  const sorted = Array.from(days).sort();
  if (sorted.length === 0) return 0;
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00Z`);
    const curr = new Date(`${sorted[i]}T00:00:00Z`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    current = diffDays === 1 ? current + 1 : 1;
    if (current > best) best = current;
  }
  return best;
}

// Computes every achievement's current progress, persists any newly-crossed
// tiers/badges to user_achievements (never revokes an earlier unlock even if
// the underlying metric regresses later), and reports which keys were
// crossed on this specific call so the UI can celebrate just those.
export async function getAchievements(): Promise<AchievementsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { achievements: [], newlyUnlockedKeys: [] };

  const [
    rates,
    { data: expensesData },
    { data: incomeData },
    { data: budgetsData },
    { data: debtsData },
    { data: walletsData },
    { data: transfersData },
    { data: subscriptionsData },
    { data: chatData },
    { data: existingData },
  ] = await Promise.all([
    getExchangeRates(BASE_CURRENCY),
    supabase
      .from("expenses")
      .select("amount, currency, category, spent_on, receipt_path"),
    supabase.from("income").select("amount, currency, received_on"),
    supabase.from("budgets").select("category, monthly_amount, created_at"),
    supabase.from("debts").select("balance"),
    supabase.from("wallets").select("id"),
    supabase.from("wallet_transfers").select("id"),
    supabase.from("subscriptions").select("id"),
    supabase.from("chat_messages").select("role").eq("role", "user").limit(1),
    supabase.from("user_achievements").select("achievement_id, tier, unlocked_at"),
  ]);

  const expenses = expensesData ?? [];
  const income = incomeData ?? [];
  const budgets = budgetsData ?? [];
  const debts = debtsData ?? [];
  const wallets = walletsData ?? [];
  const transfers = transfersData ?? [];
  const subscriptions = subscriptionsData ?? [];
  const usedAdvisor = (chatData ?? []).length > 0;

  const existing = new Map<string, UnlockedTier[]>();
  for (const row of existingData ?? []) {
    const list = existing.get(row.achievement_id) ?? [];
    list.push({ tier: row.tier as AchievementTier | "unlocked", unlockedAt: row.unlocked_at });
    existing.set(row.achievement_id, list);
  }
  const existingKeys = new Set(
    (existingData ?? []).map((r) => `${r.achievement_id}:${r.tier}`)
  );

  // Cumulative savings high-water mark: daily net (income - expense) summed
  // chronologically, tracking the running peak reached at any point.
  const dailyNet = new Map<string, number>();
  for (const e of expenses) {
    const amt = convertToBase(e.amount, e.currency, rates);
    dailyNet.set(e.spent_on, (dailyNet.get(e.spent_on) ?? 0) - amt);
  }
  for (const i of income) {
    const amt = convertToBase(i.amount, i.currency, rates);
    dailyNet.set(i.received_on, (dailyNet.get(i.received_on) ?? 0) + amt);
  }
  const sortedDays = Array.from(dailyNet.keys()).sort();
  let running = 0;
  let savingsHighWaterMark = 0;
  for (const day of sortedDays) {
    running += dailyNet.get(day)!;
    if (running > savingsHighWaterMark) savingsHighWaterMark = running;
  }

  // Best single-month income total.
  const incomeByMonth = new Map<string, number>();
  for (const i of income) {
    const key = monthKey(i.received_on);
    const amt = convertToBase(i.amount, i.currency, rates);
    incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + amt);
  }
  const bestMonthIncome = Math.max(0, ...Array.from(incomeByMonth.values()));

  // Saving streak: longest run of consecutive calendar months (from the
  // earliest activity to the current month) where income beat expenses.
  const expenseByMonth = new Map<string, number>();
  for (const e of expenses) {
    const key = monthKey(e.spent_on);
    const amt = convertToBase(e.amount, e.currency, rates);
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + amt);
  }
  const nowMonth = monthKey(new Date().toISOString());
  const activityMonths = [
    ...Array.from(incomeByMonth.keys()),
    ...Array.from(expenseByMonth.keys()),
  ];
  let savingStreakMonths = 0;
  if (activityMonths.length > 0) {
    const earliestMonth = [...activityMonths].sort()[0];
    const allMonths = monthsBetweenInclusive(earliestMonth, nowMonth);
    const flags = allMonths.map(
      (m) => (incomeByMonth.get(m) ?? 0) > (expenseByMonth.get(m) ?? 0)
    );
    savingStreakMonths = longestRun(flags);
  }

  // Logging streak: longest run of consecutive calendar days with any
  // expense or income entry.
  const loggedDays = new Set<string>();
  for (const e of expenses) loggedDays.add(e.spent_on);
  for (const i of income) loggedDays.add(i.received_on);
  const loggingStreakDays = longestDayStreak(loggedDays);

  // Budget discipline: longest run of consecutive months, starting the
  // month budgets were first set, where every budgeted category stayed
  // under its budget. Budgets are a single "current" value applied
  // retroactively - the same simplification the Budgets tab already makes.
  let budgetDisciplineMonths = 0;
  if (budgets.length > 0) {
    const spendByCategoryByMonth = new Map<string, Map<string, number>>();
    for (const e of expenses) {
      const mKey = monthKey(e.spent_on);
      const amt = convertToBase(e.amount, e.currency, rates);
      const byCat = spendByCategoryByMonth.get(mKey) ?? new Map<string, number>();
      byCat.set(e.category, (byCat.get(e.category) ?? 0) + amt);
      spendByCategoryByMonth.set(mKey, byCat);
    }
    const earliestBudgetMonth = budgets.map((b) => monthKey(b.created_at)).sort()[0];
    const allMonths = monthsBetweenInclusive(earliestBudgetMonth, nowMonth);
    const flags = allMonths.map((m) => {
      const byCat = spendByCategoryByMonth.get(m) ?? new Map<string, number>();
      return budgets.every(
        (b) => (byCat.get(b.category) ?? 0) <= Number(b.monthly_amount)
      );
    });
    budgetDisciplineMonths = longestRun(flags);
  }

  // One-off conditions.
  const hasReceiptScan = expenses.some((e) => !!e.receipt_path);
  const debtTrackerUnlocked = existingKeys.has("debt_tracker:unlocked") || debts.length > 0;
  const totalDebtBalance = debts.reduce((sum, d) => sum + Number(d.balance), 0);
  const distinctCategories = new Set(expenses.map((e) => e.category)).size;
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / 86400000
  );

  const oneOffMetrics: Record<string, boolean> = {
    first_expense: expenses.length > 0,
    first_income: income.length > 0,
    first_receipt_scan: hasReceiptScan,
    first_budget: budgets.length > 0,
    first_wallet: wallets.length > 0,
    first_transfer: transfers.length > 0,
    first_subscription: subscriptions.length > 0,
    debt_tracker: debts.length > 0,
    debt_free: debtTrackerUnlocked && debts.length > 0 && totalDebtBalance <= 0,
    used_advisor: usedAdvisor,
    category_explorer: distinctCategories >= 5,
    one_month_member: accountAgeDays >= 30,
  };

  const tieredMetrics: Record<string, number> = {
    savings_milestone: savingsHighWaterMark,
    income_milestone: bestMonthIncome,
    saving_streak: savingStreakMonths,
    logging_streak: loggingStreakDays,
    budget_discipline: budgetDisciplineMonths,
  };

  // Diff against existing rows, collect newly-crossed tiers/badges.
  const newRows: { user_id: string; achievement_id: string; tier: string }[] = [];

  for (const def of TIERED_ACHIEVEMENTS) {
    const value = tieredMetrics[def.id] ?? 0;
    for (const t of def.tiers ?? []) {
      const key = `${def.id}:${t.tier}`;
      if (value >= t.threshold && !existingKeys.has(key)) {
        newRows.push({ user_id: user.id, achievement_id: def.id, tier: t.tier });
        existingKeys.add(key);
      }
    }
  }
  for (const def of ONE_OFF_ACHIEVEMENTS) {
    const key = `${def.id}:unlocked`;
    if (oneOffMetrics[def.id] && !existingKeys.has(key)) {
      newRows.push({ user_id: user.id, achievement_id: def.id, tier: "unlocked" });
      existingKeys.add(key);
    }
  }

  const newlyUnlockedKeys = newRows.map((r) => `${r.achievement_id}:${r.tier}`);

  if (newRows.length > 0) {
    const nowIso = new Date().toISOString();
    await supabase.from("user_achievements").upsert(
      newRows.map((r) => ({ ...r, unlocked_at: nowIso })),
      { onConflict: "user_id,achievement_id,tier", ignoreDuplicates: true }
    );
    for (const row of newRows) {
      const list = existing.get(row.achievement_id) ?? [];
      list.push({ tier: row.tier as AchievementTier | "unlocked", unlockedAt: nowIso });
      existing.set(row.achievement_id, list);
    }
  }

  // Build view models.
  const achievements: AchievementView[] = [];

  for (const def of TIERED_ACHIEVEMENTS) {
    const unlockedTiers = existing.get(def.id) ?? [];
    const value = tieredMetrics[def.id] ?? 0;
    const nextTier = (def.tiers ?? []).find(
      (t) => !unlockedTiers.some((u) => u.tier === t.tier)
    );
    achievements.push({
      id: def.id,
      category: def.category,
      title: def.title,
      description: def.description,
      unit: def.unit,
      tiered: true,
      unlocked: unlockedTiers.length > 0,
      unlockedTiers,
      currentValue: value,
      nextThreshold: nextTier ? nextTier.threshold : null,
    });
  }

  for (const def of ONE_OFF_ACHIEVEMENTS) {
    const unlockedTiers = existing.get(def.id) ?? [];
    achievements.push({
      id: def.id,
      category: def.category,
      title: def.title,
      description: def.description,
      tiered: false,
      unlocked: unlockedTiers.length > 0,
      unlockedTiers,
      currentValue: null,
      nextThreshold: null,
    });
  }

  return { achievements, newlyUnlockedKeys };
}
