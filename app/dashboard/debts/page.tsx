import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { getDebtAdvice } from "@/lib/debt-advice";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import { DebtsClient } from "@/components/dashboard/debts-client";
import { IncomeInput } from "@/components/dashboard/income-input";
import { DebtAdviceCard } from "@/components/dashboard/debt-advice-card";
import type { Debt } from "@/lib/types";

export default async function DebtsPage() {
  const supabase = await createClient();

  const [{ data: debtsData }, { data: settingsData }, advice, rates] =
    await Promise.all([
      supabase.from("debts").select("*").order("created_at", { ascending: false }),
      supabase.from("user_settings").select("monthly_income").maybeSingle(),
      getDebtAdvice(),
      getExchangeRates(BASE_CURRENCY),
    ]);

  const debts = (debtsData ?? []) as Debt[];
  const totalDebt = debts.reduce(
    (sum, d) => sum + convertToBase(d.balance, d.currency, rates),
    0
  );
  const monthlyIncome = settingsData?.monthly_income
    ? Number(settingsData.monthly_income)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <DebtsClient debts={debts} totalDebt={totalDebt} baseCurrency={BASE_CURRENCY} />
      <IncomeInput monthlyIncome={monthlyIncome} baseCurrency={BASE_CURRENCY} />
      <DebtAdviceCard advice={advice} />
    </div>
  );
}
