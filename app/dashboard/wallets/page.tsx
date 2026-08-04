import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertAmount } from "@/lib/exchange-rates";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import { WalletsClient } from "@/components/dashboard/wallets-client";
import { isCreditWallet } from "@/lib/wallet-types";
import type { BalanceTransfer, Wallet, WalletTransfer } from "@/lib/types";

export default async function WalletsPage() {
  const supabase = await createClient();

  const [
    { data: walletsData },
    { data: incomeData },
    { data: expensesData },
    { data: transfersData },
    { data: balanceTransfersData },
    rates,
  ] = await Promise.all([
    supabase.from("wallets").select("*").order("created_at", { ascending: true }),
    supabase.from("income").select("amount, currency, wallet_id"),
    supabase.from("expenses").select("amount, currency, wallet_id"),
    supabase
      .from("wallet_transfers")
      .select("*")
      .order("transferred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("balance_transfers")
      .select("*")
      .order("created_at", { ascending: false }),
    getExchangeRates(BASE_CURRENCY),
  ]);

  const wallets = (walletsData ?? []) as Wallet[];
  const income = incomeData ?? [];
  const expenses = expensesData ?? [];
  const transfers = (transfersData ?? []) as WalletTransfer[];
  const balanceTransfers = (balanceTransfersData ?? []) as BalanceTransfer[];

  const walletRows = wallets.map((wallet) => {
    const incomeTotal = income
      .filter((i) => i.wallet_id === wallet.id)
      .reduce((sum, i) => sum + convertAmount(i.amount, i.currency, wallet.currency, rates), 0);
    const expenseTotal = expenses
      .filter((e) => e.wallet_id === wallet.id)
      .reduce((sum, e) => sum + convertAmount(e.amount, e.currency, wallet.currency, rates), 0);
    const transfersIn = transfers
      .filter((t) => t.to_wallet_id === wallet.id)
      .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, wallet.currency, rates), 0);
    const transfersOut = transfers
      .filter((t) => t.from_wallet_id === wallet.id)
      .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, wallet.currency, rates), 0);
    const balance =
      wallet.starting_balance + incomeTotal - expenseTotal + transfersIn - transfersOut;

    return {
      wallet,
      balance,
      balanceBase: convertAmount(balance, wallet.currency, BASE_CURRENCY, rates),
    };
  });

  const cashWalletRows = walletRows.filter((row) => !isCreditWallet(row.wallet.wallet_type));
  const creditWalletRows = walletRows.filter((row) => isCreditWallet(row.wallet.wallet_type));

  const unassignedIncome = income
    .filter((i) => !i.wallet_id)
    .reduce((sum, i) => sum + convertAmount(i.amount, i.currency, BASE_CURRENCY, rates), 0);
  const unassignedExpenses = expenses
    .filter((e) => !e.wallet_id)
    .reduce((sum, e) => sum + convertAmount(e.amount, e.currency, BASE_CURRENCY, rates), 0);
  const unassignedTotal = unassignedIncome - unassignedExpenses;

  const totalCashOnHand =
    cashWalletRows.reduce((sum, row) => sum + row.balanceBase, 0) + unassignedTotal;

  const typeTotals: Record<string, number> = {};
  for (const row of cashWalletRows) {
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

  const creditRows = creditWalletRows.map(({ wallet }) => {
    const limitBase = convertAmount(
      wallet.credit_limit ?? 0,
      wallet.currency,
      BASE_CURRENCY,
      rates
    );
    const outstandingBase = convertAmount(
      wallet.outstanding_balance ?? 0,
      wallet.currency,
      BASE_CURRENCY,
      rates
    );
    const transfersRemainingBase = balanceTransfers
      .filter((t) => t.wallet_id === wallet.id)
      .reduce(
        (sum, t) => sum + convertAmount(t.remaining_balance, t.currency, BASE_CURRENCY, rates),
        0
      );
    const usedBase = outstandingBase + transfersRemainingBase;

    return {
      walletId: wallet.id,
      name: wallet.name,
      walletType: wallet.wallet_type,
      limit: limitBase,
      used: usedBase,
      available: limitBase - usedBase,
    };
  });

  const creditSummary = {
    totalCreditLimit: creditRows.reduce((sum, r) => sum + r.limit, 0),
    totalUsed: creditRows.reduce((sum, r) => sum + r.used, 0),
    totalAvailable: creditRows.reduce((sum, r) => sum + r.available, 0),
    rows: creditRows,
  };

  return (
    <WalletsClient
      walletRows={walletRows.map(({ wallet, balance }) => ({ wallet, balance }))}
      transfers={transfers}
      unassignedTotal={unassignedTotal}
      totalCashOnHand={totalCashOnHand}
      typeBreakdown={typeBreakdown}
      creditSummary={creditSummary}
      baseCurrency={BASE_CURRENCY}
    />
  );
}
