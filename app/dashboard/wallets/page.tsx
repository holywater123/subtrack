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
    const balance = wallet.starting_balance + incomeTotal - expenseTotal;

    return {
      wallet,
      balance,
      balanceBase: convertAmount(balance, wallet.currency, BASE_CURRENCY, rates),
    };
  });

  const unassignedIncome = income
    .filter((i) => !i.wallet_id)
    .reduce((sum, i) => sum + convertAmount(i.amount, i.currency, BASE_CURRENCY, rates), 0);
  const unassignedExpenses = expenses
    .filter((e) => !e.wallet_id)
    .reduce((sum, e) => sum + convertAmount(e.amount, e.currency, BASE_CURRENCY, rates), 0);
  const unassignedTotal = unassignedIncome - unassignedExpenses;

  const totalCashOnHand =
    walletRows.reduce((sum, row) => sum + row.balanceBase, 0) + unassignedTotal;

  const typeTotals: Record<string, number> = {};
  for (const row of walletRows) {
    typeTotals[row.wallet.wallet_type] =
      (typeTotals[row.wallet.wallet_type] ?? 0) + row.balanceBase;
  }

  const typeBreakdown = Object.entries(typeTotals).map(([walletType, amount]) => ({
    walletType,
    amount,
    pct: totalCashOnHand !== 0 ? (amount / totalCashOnHand) * 100 : 0,
  }));

  if (unassignedTotal !== 0) {
    typeBreakdown.push({
      walletType: "unassigned",
      amount: unassignedTotal,
      pct: totalCashOnHand !== 0 ? (unassignedTotal / totalCashOnHand) * 100 : 0,
    });
  }

  typeBreakdown.sort((a, b) => b.amount - a.amount);

  return (
    <WalletsClient
      walletRows={walletRows.map(({ wallet, balance }) => ({ wallet, balance }))}
      unassignedTotal={unassignedTotal}
      totalCashOnHand={totalCashOnHand}
      typeBreakdown={typeBreakdown}
      baseCurrency={BASE_CURRENCY}
    />
  );
}
