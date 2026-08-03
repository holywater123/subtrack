import { createClient } from "@/lib/supabase/server";
import { getFinanceSummary, BASE_CURRENCY } from "@/lib/finance-summary";
import { CATEGORIES } from "@/lib/categories";
import { BudgetsClient, type BudgetRowData } from "@/components/dashboard/budgets-client";

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

  const rows: BudgetRowData[] = CATEGORIES.map((category) => ({
    category,
    spend: spendByCategory[category.value] ?? 0,
    budget: budgetByCategory[category.value] ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Budgets</h2>
        <p className="text-muted-foreground text-sm">
          Set a monthly cap per category. Includes both subscriptions and
          one-off expenses in that category.
        </p>
      </div>
      <BudgetsClient rows={rows} baseCurrency={BASE_CURRENCY} />
    </div>
  );
}
