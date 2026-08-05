import { createClient } from "@/lib/supabase/server";
import { cleanupExpiredReceipts } from "@/lib/receipt-cleanup";
import { syncSubscriptionBilling } from "@/lib/subscription-billing";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import { ExpensesClient } from "@/components/dashboard/expenses-client";
import type { Expense, Wallet } from "@/lib/types";

export default async function ExpensesPage() {
  const supabase = await createClient();

  // This page reads expenses directly, not through getFinanceSummary(), so
  // it needs its own sync call to stay correct if it's the first page a
  // user visits in a session - otherwise a subscription billed today
  // wouldn't show up here until they'd visited Overview or Subscriptions.
  await Promise.all([cleanupExpiredReceipts(), syncSubscriptionBilling()]);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: expenses }, { data: wallets }, { data: settings }, rates] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("*")
        .order("spent_on", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("wallets").select("*").order("created_at", { ascending: true }),
      supabase
        .from("user_settings")
        .select("default_currency")
        .eq("user_id", user!.id)
        .maybeSingle(),
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
      wallets={(wallets ?? []) as Wallet[]}
      defaultCurrency={settings?.default_currency ?? "MYR"}
    />
  );
}
