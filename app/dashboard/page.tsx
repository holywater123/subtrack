import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFinanceSummary, BASE_CURRENCY } from "@/lib/finance-summary";
import { syncSubscriptionBilling } from "@/lib/subscription-billing";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { getSpendingInsight } from "@/lib/ai-insight";
import { CATEGORIES } from "@/lib/categories";
import { normalizeOverviewLayout, type OverviewSectionId } from "@/lib/overview-layout";
import { PeriodEstimateCard } from "@/components/dashboard/period-estimate-card";
import { IncomeSummaryCard } from "@/components/dashboard/income-summary-card";
import { AiInsightCard } from "@/components/dashboard/ai-insight-card";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import {
  SpendingTrendCard,
  type TrendExpense,
} from "@/components/dashboard/spending-trend-card";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";

export default async function OverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Must finish before the expenses query below starts, not just before
  // getFinanceSummary()'s own internal one - getFinanceSummary() awaits
  // this same sync internally, but that's a separate call, and this
  // page's own all-time expenses query below runs concurrently with it in
  // the Promise.all. Without awaiting it out here first, the two can race:
  // the query below can read before a just-inserted subscription expense
  // (dated today) commits, so today's actual spend silently doesn't
  // include a subscription that was due today. This second call is then
  // a cheap no-op for getFinanceSummary() (nothing left to sync).
  await syncSubscriptionBilling();

  const [
    financeSummary,
    insight,
    { data: budgetsData },
    { data: settingsData },
    { data: expensesData },
    { data: incomeData },
    rates,
  ] = await Promise.all([
    getFinanceSummary(),
    getSpendingInsight(),
    supabase.from("budgets").select("category, monthly_amount"),
    supabase
      .from("user_settings")
      .select("overview_layout")
      .eq("user_id", user!.id)
      .maybeSingle(),
    // Unbounded - the Spending trend card and Spending estimate card both
    // let the user navigate to any past day/week/month/year, not just the
    // current one, so they need full history (same as the Expenses tab's
    // own fetch), not just the current month.
    supabase.from("expenses").select("amount, currency, spent_on"),
    supabase.from("income").select("amount, currency, received_on"),
    getExchangeRates(BASE_CURRENCY),
  ]);

  const { totalSubscriptionsMonthly, spendByCategory } = financeSummary;

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

  const allExpenses: TrendExpense[] = (expensesData ?? []).map((e) => ({
    amountBase: convertToBase(e.amount, e.currency, rates),
    spentOn: e.spent_on,
  }));
  const allIncome = (incomeData ?? []).map((i) => ({
    amountBase: convertToBase(i.amount, i.currency, rates),
    receivedOn: i.received_on,
  }));

  const sections: Record<OverviewSectionId, React.ReactNode> = {
    estimate: (
      <PeriodEstimateCard
        subscriptionsMonthly={totalSubscriptionsMonthly}
        expenses={allExpenses}
        baseCurrency={BASE_CURRENCY}
      />
    ),
    trend: <SpendingTrendCard expenses={allExpenses} baseCurrency={BASE_CURRENCY} />,
    income: (
      <IncomeSummaryCard
        income={allIncome}
        expenses={allExpenses}
        baseCurrency={BASE_CURRENCY}
      />
    ),
    insight: <AiInsightCard insight={insight} />,
    budgets: (
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
    ),
  };

  const layout = normalizeOverviewLayout(settingsData?.overview_layout);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
          <p className="text-muted-foreground text-sm">
            Your finances at a glance.
          </p>
        </div>
        <Link href="/dashboard/customize">
          <Button variant="ghost" size="icon" aria-label="Customize Overview">
            <SlidersHorizontal className="size-4" />
          </Button>
        </Link>
      </div>

      {layout
        .filter((section) => section.visible)
        .map((section) => (
          <div key={section.id}>{sections[section.id]}</div>
        ))}
    </div>
  );
}
