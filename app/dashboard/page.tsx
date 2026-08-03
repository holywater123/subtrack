import { createClient } from "@/lib/supabase/server";
import { getFinanceSummary, BASE_CURRENCY } from "@/lib/finance-summary";
import { getSpendingInsight } from "@/lib/ai-insight";
import { CATEGORIES } from "@/lib/categories";
import { PeriodEstimateCard } from "@/components/dashboard/period-estimate-card";
import { AiInsightCard } from "@/components/dashboard/ai-insight-card";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { MagicCard } from "@/components/ui/magic-card";

export default async function OverviewPage() {
  const supabase = await createClient();

  const [financeSummary, insight, { data: budgetsData }] = await Promise.all([
    getFinanceSummary(),
    getSpendingInsight(),
    supabase.from("budgets").select("category, monthly_amount"),
  ]);

  const { totalSubscriptionsMonthly, spendByCategory, expensesThisMonth } =
    financeSummary;

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
