import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertAmount, convertToBase } from "@/lib/exchange-rates";
import { getFinanceSummary, BASE_CURRENCY } from "@/lib/finance-summary";
import { getCategory } from "@/lib/categories";
import { getIncomeCategory } from "@/lib/income-categories";
import { getDebtType } from "@/lib/debt-types";
import { getWalletType } from "@/lib/wallet-types";
import { monthlyEquivalentInBase } from "@/lib/subscription-math";
import type { Debt, Wallet, WalletTransfer } from "@/lib/types";

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toISODate(start), end: toISODate(end) };
}

// Builds a plain-text snapshot of the signed-in user's actual data across
// every part of the app, so the AI advisor only ever reasons over real
// numbers instead of guessing - passed straight into the chat system prompt.
export async function buildFinanceSnapshot(): Promise<string> {
  const supabase = await createClient();
  const { start, end } = currentMonthRange();

  const [
    financeSummary,
    { data: debtsData },
    { data: walletsData },
    { data: allIncomeData },
    { data: allExpensesData },
    { data: transfersData },
    { data: monthIncomeData },
    { data: budgetsData },
    rates,
  ] = await Promise.all([
    getFinanceSummary(),
    supabase.from("debts").select("*"),
    supabase.from("wallets").select("*"),
    supabase.from("income").select("amount, currency, wallet_id"),
    supabase.from("expenses").select("amount, currency, wallet_id"),
    supabase.from("wallet_transfers").select("*"),
    supabase
      .from("income")
      .select("amount, currency, category")
      .gte("received_on", start)
      .lt("received_on", end),
    supabase.from("budgets").select("category, monthly_amount"),
    getExchangeRates(BASE_CURRENCY),
  ]);

  const debts = (debtsData ?? []) as Debt[];
  const wallets = (walletsData ?? []) as Wallet[];
  const transfers = (transfersData ?? []) as WalletTransfer[];
  const allIncome = allIncomeData ?? [];
  const allExpenses = allExpensesData ?? [];
  const monthIncome = monthIncomeData ?? [];

  const lines: string[] = [];
  lines.push(`All amounts are in ${BASE_CURRENCY} unless noted.`);

  const activeSubs = financeSummary.subscriptions.filter((s) => !s.is_paused);
  lines.push(
    `\nSubscriptions (${activeSubs.length} active, ${financeSummary.totalSubscriptionsMonthly.toFixed(2)}/mo total):`
  );
  lines.push(
    activeSubs.length
      ? activeSubs
          .map(
            (s) =>
              `- ${s.name} (${getCategory(s.category).label}): ${monthlyEquivalentInBase(s, rates).toFixed(2)}/mo`
          )
          .join("\n")
      : "- none"
  );

  const monthIncomeTotal = monthIncome.reduce(
    (sum, i) => sum + convertToBase(i.amount, i.currency, rates),
    0
  );
  const incomeByCategory: Record<string, number> = {};
  for (const i of monthIncome) {
    incomeByCategory[i.category] =
      (incomeByCategory[i.category] ?? 0) + convertToBase(i.amount, i.currency, rates);
  }
  lines.push(`\nIncome this month (total ${monthIncomeTotal.toFixed(2)}):`);
  lines.push(
    Object.keys(incomeByCategory).length
      ? Object.entries(incomeByCategory)
          .map(([cat, amt]) => `- ${getIncomeCategory(cat).label}: ${amt.toFixed(2)}`)
          .join("\n")
      : "- none logged"
  );

  lines.push(
    `\nExpenses this month (total ${financeSummary.totalExpensesThisMonth.toFixed(2)}):`
  );
  const expenseCategoryLines = Object.entries(financeSummary.spendByCategory)
    .filter(([, amt]) => amt > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amt]) => `- ${getCategory(cat).label}: ${amt.toFixed(2)}`);
  lines.push(
    expenseCategoryLines.length ? expenseCategoryLines.join("\n") : "- none logged"
  );

  if ((budgetsData ?? []).length) {
    lines.push("\nBudgets (monthly cap vs actual spend, combined subscriptions + expenses):");
    lines.push(
      budgetsData!
        .map((b) => {
          const spend = financeSummary.spendByCategory[b.category] ?? 0;
          return `- ${getCategory(b.category).label}: ${spend.toFixed(2)} of ${Number(b.monthly_amount).toFixed(2)}`;
        })
        .join("\n")
    );
  }

  const totalDebt = debts.reduce(
    (sum, d) => sum + convertToBase(d.balance, d.currency, rates),
    0
  );
  lines.push(`\nDebts (${debts.length}, total ${totalDebt.toFixed(2)}):`);
  lines.push(
    debts.length
      ? debts
          .map((d) => {
            const balanceBase = convertToBase(d.balance, d.currency, rates);
            const rate = d.interest_rate !== null ? `${d.interest_rate}% interest` : "rate unknown";
            const due = d.due_date ? `due ${d.due_date}` : "no due date";
            return `- ${d.name} (${getDebtType(d.debt_type).label}): ${balanceBase.toFixed(2)}, ${rate}, ${due}`;
          })
          .join("\n")
      : "- none logged"
  );

  if (wallets.length) {
    const walletBalances = wallets.map((w) => {
      const incomeTotal = allIncome
        .filter((i) => i.wallet_id === w.id)
        .reduce((sum, i) => sum + convertAmount(i.amount, i.currency, w.currency, rates), 0);
      const expenseTotal = allExpenses
        .filter((e) => e.wallet_id === w.id)
        .reduce((sum, e) => sum + convertAmount(e.amount, e.currency, w.currency, rates), 0);
      const transfersIn = transfers
        .filter((t) => t.to_wallet_id === w.id)
        .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, w.currency, rates), 0);
      const transfersOut = transfers
        .filter((t) => t.from_wallet_id === w.id)
        .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, w.currency, rates), 0);
      const balance =
        w.starting_balance + incomeTotal - expenseTotal + transfersIn - transfersOut;
      return {
        wallet: w,
        balanceBase: convertAmount(balance, w.currency, BASE_CURRENCY, rates),
      };
    });

    const unassignedIncome = allIncome
      .filter((i) => !i.wallet_id)
      .reduce((sum, i) => sum + convertToBase(i.amount, i.currency, rates), 0);
    const unassignedExpenses = allExpenses
      .filter((e) => !e.wallet_id)
      .reduce((sum, e) => sum + convertToBase(e.amount, e.currency, rates), 0);
    const unassignedTotal = unassignedIncome - unassignedExpenses;
    const totalCashOnHand =
      walletBalances.reduce((sum, w) => sum + w.balanceBase, 0) + unassignedTotal;

    lines.push(
      `\nWallets (${wallets.length}, total cash on hand ${totalCashOnHand.toFixed(2)}):`
    );
    lines.push(
      walletBalances
        .map(({ wallet: w, balanceBase }) => {
          const pool = w.is_cash_pool ? ", cash pool" : "";
          return `- ${w.name} (${getWalletType(w.wallet_type).label}${pool}): ${balanceBase.toFixed(2)}`;
        })
        .join("\n")
    );
    if (unassignedTotal !== 0) {
      lines.push(`- Unassigned (not yet sorted into a wallet): ${unassignedTotal.toFixed(2)}`);
    }
  }

  return lines.join("\n");
}
