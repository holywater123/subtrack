import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { getDebtAdvice } from "@/lib/debt-advice";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import { DebtsClient } from "@/components/dashboard/debts-client";
import { DebtAdviceCard } from "@/components/dashboard/debt-advice-card";
import type { Debt } from "@/lib/types";

export default async function DebtsPage() {
  const supabase = await createClient();

  const [{ data: debtsData }, advice, rates] = await Promise.all([
    supabase.from("debts").select("*").order("created_at", { ascending: false }),
    getDebtAdvice(),
    getExchangeRates(BASE_CURRENCY),
  ]);

  const debts = (debtsData ?? []) as Debt[];
  const totalDebt = debts.reduce(
    (sum, d) => sum + convertToBase(d.balance, d.currency, rates),
    0
  );

  return (
    <div className="flex flex-col gap-6">
      <DebtsClient debts={debts} totalDebt={totalDebt} baseCurrency={BASE_CURRENCY} />
      <DebtAdviceCard advice={advice} />
    </div>
  );
}
