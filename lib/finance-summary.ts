import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { monthlyEquivalentInBase } from "@/lib/subscription-math";
import { CATEGORY_VALUES } from "@/lib/categories";
import type { Subscription } from "@/lib/types";

export const BASE_CURRENCY = "MYR";

export interface FinanceSummary {
  subscriptions: Subscription[];
  totalSubscriptionsMonthly: number;
  totalExpensesThisMonth: number;
  spendByCategory: Record<string, number>;
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
        .select("amount, currency, category")
        .gte("spent_on", start)
        .lt("spent_on", end),
    ]);
  const subscriptions = (subscriptionsData ?? []) as Subscription[];

  const spendByCategory: Record<string, number> = {};
  for (const category of CATEGORY_VALUES) spendByCategory[category] = 0;

  let totalSubscriptionsMonthly = 0;
  for (const sub of subscriptions) {
    if (sub.is_paused) continue;
    const amount = monthlyEquivalentInBase(sub, rates);
    totalSubscriptionsMonthly += amount;
    spendByCategory[sub.category] = (spendByCategory[sub.category] ?? 0) + amount;
  }

  let totalExpensesThisMonth = 0;
  for (const expense of expensesData ?? []) {
    const amount = convertToBase(expense.amount, expense.currency, rates);
    totalExpensesThisMonth += amount;
    spendByCategory[expense.category] =
      (spendByCategory[expense.category] ?? 0) + amount;
  }

  return {
    subscriptions,
    totalSubscriptionsMonthly,
    totalExpensesThisMonth,
    spendByCategory,
  };
}
