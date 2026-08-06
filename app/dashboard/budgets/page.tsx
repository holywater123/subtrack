import { createClient } from "@/lib/supabase/server";
import { getFinanceSummary, BASE_CURRENCY } from "@/lib/finance-summary";
import { CATEGORIES } from "@/lib/categories";
import { BudgetsClient, type BudgetRowData } from "@/components/dashboard/budgets-client";
import type { CategoryOption } from "@/components/dashboard/add-budget-dialog";

export default async function BudgetsPage() {
  const supabase = await createClient();

  const [{ spendByCategory }, { data: budgetsData }] = await Promise.all([
    getFinanceSummary(),
    supabase.from("budgets").select("category, monthly_amount"),
  ]);

  const budgetByCategory: Record<string, number> = {};
  for (const b of budgetsData ?? []) {
    budgetByCategory[b.category] = Number(b.monthly_amount);
  }

  // Only categories that actually have a budget set get a row - showing
  // all ~20 categories up front (most of which nobody budgets) was pure
  // clutter. New ones are added deliberately via the "Add budget" dialog,
  // which picks from whatever's left in `unbudgetedCategories`.
  const rows: BudgetRowData[] = CATEGORIES.filter(
    (category) => budgetByCategory[category.value] !== undefined
  ).map((category) => ({
    categoryValue: category.value,
    spend: spendByCategory[category.value] ?? 0,
    budget: budgetByCategory[category.value],
  }));

  const unbudgetedCategories: CategoryOption[] = CATEGORIES.filter(
    (category) => budgetByCategory[category.value] === undefined
  ).map((category) => ({ value: category.value, label: category.label }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Budgets</h2>
        <p className="text-muted-foreground text-sm">
          Set a monthly cap per category. Includes both subscriptions and
          one-off expenses in that category.
        </p>
      </div>
      <BudgetsClient
        rows={rows}
        unbudgetedCategories={unbudgetedCategories}
        baseCurrency={BASE_CURRENCY}
      />
    </div>
  );
}
