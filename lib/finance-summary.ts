import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { monthlyEquivalentInBase } from "@/lib/subscription-math";
import { syncSubscriptionBilling } from "@/lib/subscription-billing";
import { CATEGORY_VALUES } from "@/lib/categories";
import type { Subscription } from "@/lib/types";

export const BASE_CURRENCY = "MYR";

export interface ExpenseThisMonth {
  amountBase: number;
  spentOn: string;
}

export interface FinanceSummary {
  subscriptions: Subscription[];
  totalSubscriptionsMonthly: number;
  totalExpensesThisMonth: number;
  spendByCategory: Record<string, number>;
  expensesThisMonth: ExpenseThisMonth[];
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISODate(start), end: toISODate(end) };
}

// Combines non-paused subscriptions (monthly-equivalent) with this calendar
// month's one-off expenses, both converted to BASE_CURRENCY, so Overview and
// Budgets always agree on how much has been spent per category.
export async function getFinanceSummary(): Promise<FinanceSummary> {
  // Lazily creates this month's expense row for any subscription whose
  // billing date has been reached, before we read expenses below - so a
  // subscription's cost is counted exactly once, as a real expense, never
  // as a separate phantom "monthly equivalent" added on top.
  await syncSubscriptionBilling();

  const supabase = await createClient();
  const { start, end } = currentMonthRange();

  // These three are independent - run them concurrently instead of
  // sequentially awaiting each one, which was adding up to two extra
  // network round-trips of latency per page load.
  const [rates, { data: subscriptionsData }, { data: expensesData }] =
    await Promise.all([
      getExchangeRates(BASE_CURRENCY),
      supabase.from("subscriptions").select("*"),
      supabase
        .from("expenses")
        .select("amount, currency, category, spent_on, subscription_id")
        .gte("spent_on", start)
        .lt("spent_on", end),
    ]);
  const subscriptions = (subscriptionsData ?? []) as Subscription[];

  const spendByCategory: Record<string, number> = {};
  for (const category of CATEGORY_VALUES) spendByCategory[category] = 0;

  let totalExpensesThisMonth = 0;
  const expensesThisMonth: ExpenseThisMonth[] = [];
  const billedSubscriptionIds = new Set<string>();
  for (const expense of expensesData ?? []) {
    const amount = convertToBase(expense.amount, expense.currency, rates);
    totalExpensesThisMonth += amount;
    spendByCategory[expense.category] =
      (spendByCategory[expense.category] ?? 0) + amount;
    expensesThisMonth.push({ amountBase: amount, spentOn: expense.spent_on });
    if (expense.subscription_id) billedSubscriptionIds.add(expense.subscription_id);
  }

  // Subscriptions already billed this month are counted above as real
  // expenses - only recurring cost still ahead this month belongs in the
  // "fixed" monthly figure, otherwise it would be double-counted.
  let totalSubscriptionsMonthly = 0;
  for (const sub of subscriptions) {
    if (sub.is_paused || billedSubscriptionIds.has(sub.id)) continue;
    totalSubscriptionsMonthly += monthlyEquivalentInBase(sub, rates);
  }

  return {
    subscriptions,
    totalSubscriptionsMonthly,
    totalExpensesThisMonth,
    spendByCategory,
    expensesThisMonth,
  };
}
