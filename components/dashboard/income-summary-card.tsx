"use client";

import { useMemo, useState } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { PeriodPicker } from "@/components/ui/period-picker";
import { currencySymbol } from "@/lib/currencies";
import {
  PERIODS,
  formatPeriodLabel,
  isCurrentPeriod,
  isInPeriodRange,
  type Period,
} from "@/lib/period";

export interface IncomeEntry {
  amountBase: number;
  receivedOn: string;
}

export interface ExpenseEntry {
  amountBase: number;
  spentOn: string;
}

function periodPhrase(period: Period, referenceDate: Date, current: boolean) {
  const label = formatPeriodLabel(period, referenceDate);
  if (period === "day") return current ? "today" : `on ${label}`;
  if (period === "week") return current ? "this week" : label;
  return current ? "this month" : `in ${label}`;
}

export function IncomeSummaryCard({
  income,
  expenses,
  baseCurrency,
}: {
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  baseCurrency: string;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const symbol = currencySymbol(baseCurrency);
  const current = isCurrentPeriod(period, referenceDate);

  const { totalIncome, net } = useMemo(() => {
    const totalIncome = income
      .filter((i) => isInPeriodRange(i.receivedOn, period, referenceDate))
      .reduce((sum, i) => sum + i.amountBase, 0);
    const totalExpenses = expenses
      .filter((e) => isInPeriodRange(e.spentOn, period, referenceDate))
      .reduce((sum, e) => sum + e.amountBase, 0);
    return { totalIncome, net: totalIncome - totalExpenses };
  }, [income, expenses, period, referenceDate]);

  const netLine = `Net ${net >= 0 ? "+" : "-"}${symbol}${Math.abs(net).toFixed(2)} ${
    current ? "so far " : ""
  }${periodPhrase(period, referenceDate, current)}`;

  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">Income</p>
      <div className="mt-2">
        <PeriodPicker
          period={period}
          referenceDate={referenceDate}
          onPeriodChange={setPeriod}
          onReferenceDateChange={setReferenceDate}
          periods={PERIODS}
        />
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">{symbol}</span>
        <NumberTicker
          value={totalIncome}
          decimalPlaces={2}
          className="text-4xl font-semibold tracking-tight"
        />
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{netLine}</p>
    </MagicCard>
  );
}
