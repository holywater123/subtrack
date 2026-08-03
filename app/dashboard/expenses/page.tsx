import { createClient } from "@/lib/supabase/server";
import { cleanupExpiredReceipts } from "@/lib/receipt-cleanup";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import { ExpensesClient } from "@/components/dashboard/expenses-client";
import type { Expense } from "@/lib/types";

export default async function ExpensesPage() {
  const supabase = await createClient();

  await cleanupExpiredReceipts();

  const [{ data: expenses }, rates] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false }),
    getExchangeRates(BASE_CURRENCY),
  ]);

  const expensesList = (expenses ?? []) as Expense[];
  const breakdownExpenses = expensesList.map((e) => ({
    amountBase: convertToBase(e.amount, e.currency, rates),
    category: e.category,
    spentOn: e.spent_on,
  }));

  return (
    <ExpensesClient
      expenses={expensesList}
      breakdownExpenses={breakdownExpenses}
      baseCurrency={BASE_CURRENCY}
    />
  );
}
