import { createClient } from "@/lib/supabase/server";
import { getFinanceSummary, BASE_CURRENCY } from "@/lib/finance-summary";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { getSpendingInsight } from "@/lib/ai-insight";
import { CATEGORIES } from "@/lib/categories";
import { PeriodEstimateCard } from "@/components/dashboard/period-estimate-card";
import { TotalSpendCard } from "@/components/dashboard/total-spend-card";
import { AiInsightCard } from "@/components/dashboard/ai-insight-card";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { MagicCard } from "@/components/ui/magic-card";
import { currencySymbol } from "@/lib/currencies";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISODate(start), end: toISODate(end) };
}

export default async function OverviewPage() {
  const supabase = await createClient();
  const { start, end } = currentMonthRange();

  const [financeSummary, insight, { data: budgetsData }, { data: incomeData }, rates] =
    await Promise.all([
      getFinanceSummary(),
      getSpendingInsight(),
      supabase.from("budgets").select("category, monthly_amount"),
      supabase
        .from("income")
        .select("amount, currency")
        .gte("received_on", start)
        .lt("received_on", end),
      getExchangeRates(BASE_CURRENCY),
    ]);

  const { totalSubscriptionsMonthly, spendByCategory, expensesThisMonth } =
    financeSummary;

  const totalIncomeThisMonth = (incomeData ?? []).reduce(
    (sum, i) => sum + convertToBase(i.amount, i.currency, rates),
    0
  );
  const net = totalIncomeThisMonth - financeSummary.totalExpensesThisMonth;

  const budgetByCategory: Record<string, number> = {};
  for (const b of budgetsData ?? []) {
    budgetByCategory[b.category] = Number(b.monthly_amount);
  }

  const budgetRows = CATEGORIES.filter(
    (c) => budgetByCategory[c.value] !== undefined
  ).map((c) => ({
    category: c,
    spend: spendByCategory[c.value] ?? 0,
    budget: budgetByCategory[c.value],
  }));

  return (
    <div className="flex flex-col gap-6">
      <PeriodEstimateCard
        subscriptionsMonthly={totalSubscriptionsMonthly}
        expenses={expensesThisMonth}
        baseCurrency={BASE_CURRENCY}
      />

      <TotalSpendCard
        label="Income this month"
        totalMonthly={totalIncomeThisMonth}
        subtitle={`Net ${net >= 0 ? "+" : "-"}${currencySymbol(BASE_CURRENCY)}${Math.abs(net).toFixed(2)} after ${currencySymbol(BASE_CURRENCY)}${financeSummary.totalExpensesThisMonth.toFixed(2)} in subscriptions + expenses`}
        baseCurrency={BASE_CURRENCY}
      />

      <AiInsightCard insight={insight} />

      <div>
        <h2 className="text-muted-foreground mb-3 text-sm font-medium">
          Budgets
        </h2>

        {budgetRows.length === 0 ? (
          <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
            No budgets set yet. Head to the Budgets tab to set a monthly cap
            per category.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {budgetRows.map((row) => (
              <MagicCard key={row.category.value} className="rounded-xl p-4">
                <BudgetProgress
                  category={row.category}
                  spend={row.spend}
                  budget={row.budget}
                  baseCurrency={BASE_CURRENCY}
                />
              </MagicCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
