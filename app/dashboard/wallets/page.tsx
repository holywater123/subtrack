import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertAmount } from "@/lib/exchange-rates";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import { WalletsClient } from "@/components/dashboard/wallets-client";
import type { Wallet } from "@/lib/types";

export default async function WalletsPage() {
  const supabase = await createClient();

  const [{ data: walletsData }, { data: incomeData }, { data: expensesData }, rates] =
    await Promise.all([
      supabase.from("wallets").select("*").order("created_at", { ascending: true }),
      supabase.from("income").select("amount, currency, wallet_id"),
      supabase.from("expenses").select("amount, currency, wallet_id"),
      getExchangeRates(BASE_CURRENCY),
    ]);

  const wallets = (walletsData ?? []) as Wallet[];
  const income = incomeData ?? [];
  const expenses = expensesData ?? [];

  const walletRows = wallets.map((wallet) => {
    const incomeTotal = income
      .filter((i) => i.wallet_id === wallet.id)
      .reduce((sum, i) => sum + convertAmount(i.amount, i.currency, wallet.currency, rates), 0);
    const expenseTotal = expenses
      .filter((e) => e.wallet_id === wallet.id)
      .reduce((sum, e) => sum + convertAmount(e.amount, e.currency, wallet.currency, rates), 0);

    return {
      wallet,
      balance: wallet.starting_balance + incomeTotal - expenseTotal,
    };
  });

  const unassignedIncome = income
    .filter((i) => !i.wallet_id)
    .reduce((sum, i) => sum + convertAmount(i.amount, i.currency, BASE_CURRENCY, rates), 0);
  const unassignedExpenses = expenses
    .filter((e) => !e.wallet_id)
    .reduce((sum, e) => sum + convertAmount(e.amount, e.currency, BASE_CURRENCY, rates), 0);

  return (
    <WalletsClient
      walletRows={walletRows}
      unassignedTotal={unassignedIncome - unassignedExpenses}
      baseCurrency={BASE_CURRENCY}
    />
  );
}
