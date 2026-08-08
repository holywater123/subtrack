import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertAmount } from "@/lib/exchange-rates";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import { WalletsClient } from "@/components/dashboard/wallets-client";
import { isCreditWallet } from "@/lib/wallet-types";
import type {
  BalanceTransfer,
  DebtPayment,
  Wallet,
  WalletAdjustment,
  WalletTransfer,
} from "@/lib/types";

export default async function WalletsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: walletsData },
    { data: incomeData },
    { data: expensesData },
    { data: transfersData },
    { data: balanceTransfersData },
    { data: debtPaymentsData },
    { data: adjustmentsData },
    { data: settings },
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
    supabase.from("debt_payments").select("source_wallet_id, amount, currency"),
    supabase
      .from("wallet_adjustments")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_settings")
      .select("default_currency")
      .eq("user_id", user!.id)
      .maybeSingle(),
    getExchangeRates(BASE_CURRENCY),
  ]);

  const wallets = (walletsData ?? []) as Wallet[];
  const income = incomeData ?? [];
  const expenses = expensesData ?? [];
  const transfers = (transfersData ?? []) as WalletTransfer[];
  const balanceTransfers = (balanceTransfersData ?? []) as BalanceTransfer[];
  const debtPayments = (debtPaymentsData ?? []) as Pick<
    DebtPayment,
    "source_wallet_id" | "amount" | "currency"
  >[];
  const adjustments = (adjustmentsData ?? []) as WalletAdjustment[];

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
    // Principal portion of debt/credit-card payments made FROM this wallet -
    // real cash leaving to settle debt, kept separate from expenseTotal so
    // it isn't double-counted as spend (interest already flows through
    // expenseTotal via its own wallet-linked expense row).
    const debtPaymentsOut = debtPayments
      .filter((p) => p.source_wallet_id === wallet.id)
      .reduce((sum, p) => sum + convertAmount(p.amount, p.currency, wallet.currency, rates), 0);
    // Manual reconciliation deltas (see reconcileWallet in
    // app/dashboard/wallets/actions.ts) - signed, so this can push the
    // balance either direction.
    const adjustmentsTotal = adjustments
      .filter((a) => a.wallet_id === wallet.id)
      .reduce((sum, a) => sum + convertAmount(a.amount, a.currency, wallet.currency, rates), 0);
    const balance =
      wallet.starting_balance +
      incomeTotal -
      expenseTotal +
      transfersIn -
      transfersOut -
      debtPaymentsOut +
      adjustmentsTotal;

    return {
      wallet,
      balance,
      balanceBase: convertAmount(balance, wallet.currency, BASE_CURRENCY, rates),
    };
  });

  const cashWalletRows = walletRows.filter((row) => !isCreditWallet(row.wallet.wallet_type));
  const creditWalletRows = walletRows.filter((row) => isCreditWallet(row.wallet.wallet_type));
  // Same restriction as app/dashboard/debts/page.tsx's sourceWallets - a
  // payment (here, a balance-transfer installment) can't come "from" a
  // credit/pay-later wallet. Computed once here, same pattern as debts,
  // rather than re-filtered per-row.
  const sourceWallets = wallets.filter((w) => !isCreditWallet(w.wallet_type));

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
      balanceTransfers={balanceTransfers}
      adjustments={adjustments}
      sourceWallets={sourceWallets}
      unassignedTotal={unassignedTotal}
      totalCashOnHand={totalCashOnHand}
      typeBreakdown={typeBreakdown}
      creditSummary={creditSummary}
      baseCurrency={BASE_CURRENCY}
      defaultCurrency={settings?.default_currency ?? "MYR"}
    />
  );
}
