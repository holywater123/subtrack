import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertAmount } from "@/lib/exchange-rates";
import { getDebtAdvice } from "@/lib/debt-advice";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import { debtsAndCreditWalletsToItems } from "@/lib/debt-list";
import { isCreditWallet } from "@/lib/wallet-types";
import { DebtsClient } from "@/components/dashboard/debts-client";
import { DebtAdviceCard } from "@/components/dashboard/debt-advice-card";
import type { Debt, Wallet } from "@/lib/types";

export default async function DebtsPage() {
  const supabase = await createClient();

  const [{ data: debtsData }, { data: walletsData }, advice, rates] = await Promise.all([
    supabase.from("debts").select("*").order("created_at", { ascending: false }),
    supabase.from("wallets").select("*").order("created_at", { ascending: true }),
    getDebtAdvice(),
    getExchangeRates(BASE_CURRENCY),
  ]);

  const debts = (debtsData ?? []) as Debt[];
  const wallets = (walletsData ?? []) as Wallet[];

  const items = debtsAndCreditWalletsToItems(debts, wallets).map((item) => ({
    item,
    balanceBase: convertAmount(item.balance, item.currency, BASE_CURRENCY, rates),
  }));
  items.sort((a, b) => b.balanceBase - a.balanceBase);

  const totalDebt = items.reduce((sum, { balanceBase }) => sum + balanceBase, 0);

  // Wallets a debt payment can come out of - a credit line can't pay down
  // another debt (or itself), so only cash-like accounts are offered.
  const sourceWallets = wallets.filter((w) => !isCreditWallet(w.wallet_type));

  return (
    <div className="flex flex-col gap-6">
      <DebtsClient
        items={items.map(({ item }) => item)}
        totalDebt={totalDebt}
        baseCurrency={BASE_CURRENCY}
        sourceWallets={sourceWallets}
      />
      <DebtAdviceCard advice={advice} />
    </div>
  );
}
