import { createClient } from "@/lib/supabase/server";
import { getFinanceSummary, BASE_CURRENCY } from "@/lib/finance-summary";
import { CATEGORIES } from "@/lib/categories";
import { TotalSpendCard } from "@/components/dashboard/total-spend-card";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { MagicCard } from "@/components/ui/magic-card";

export default async function OverviewPage() {
  const supabase = await createClient();

  const [{ totalSubscriptionsMonthly, totalExpensesThisMonth, spendByCategory }, { data: budgetsData }] =
    await Promise.all([
      getFinanceSummary(),
      supabase.from("budgets").select("category, monthly_amount"),
    ]);

  const budgetByCategory: Record<string, number> = {};
  for (const b of budgetsData ?? []) {
    budgetByCategory[b.category] = Number(b.monthly_amount);
  }

  const totalMonthly = totalSubscriptionsMonthly + totalExpensesThisMonth;

  const budgetRows = CATEGORIES.filter(
    (c) => budgetByCategory[c.value] !== undefined
  ).map((c) => ({
    category: c,
    spend: spendByCategory[c.value] ?? 0,
    budget: budgetByCategory[c.value],
  }));

  return (
    <div className="flex flex-col gap-6">
      <TotalSpendCard
        totalMonthly={totalMonthly}
        subtitle={`Subscriptions + this month's expenses - converted to ${BASE_CURRENCY}`}
        baseCurrency={BASE_CURRENCY}
      />

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
