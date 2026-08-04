"use client";

import { useMemo, useState } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { PeriodPicker } from "@/components/ui/period-picker";
import { currencySymbol } from "@/lib/currencies";
import type { ExpenseThisMonth } from "@/lib/finance-summary";
import {
  AVG_DAYS_PER_MONTH,
  PERIODS,
  daysIntoWeek,
  formatPeriodLabel,
  isCurrentPeriod,
  isInPeriodRange,
  type Period,
} from "@/lib/period";

function summaryLine(period: Period, referenceDate: Date, current: boolean) {
  const label = formatPeriodLabel(period, referenceDate);
  const lead = current ? "Actual spend so far" : "Total spend";
  if (period === "day") return `${lead} ${current ? "today" : `on ${label}`}`;
  if (period === "week") return `${lead} ${current ? "this week" : label}`;
  return `${lead} ${current ? "this month" : `in ${label}`}`;
}

export function PeriodEstimateCard({
  subscriptionsMonthly,
  expenses,
  baseCurrency,
}: {
  subscriptionsMonthly: number;
  expenses: ExpenseThisMonth[];
  baseCurrency: string;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const symbol = currencySymbol(baseCurrency);
  const current = isCurrentPeriod(period, referenceDate);

  const stats = useMemo(() => {
    const variableTotal = expenses
      .filter((e) => isInPeriodRange(e.spentOn, period, referenceDate))
      .reduce((sum, e) => sum + e.amountBase, 0);

    if (period === "day") {
      const fixed = subscriptionsMonthly / AVG_DAYS_PER_MONTH;
      return {
        fixed,
        variableTotal,
        actual: fixed + variableTotal,
        projected: fixed + variableTotal,
        note: current ? "No projection for partial days - shown as spent so far." : null,
      };
    }

    if (period === "week") {
      const fixed = (subscriptionsMonthly * 7) / AVG_DAYS_PER_MONTH;
      if (!current) {
        return {
          fixed,
          variableTotal,
          actual: fixed + variableTotal,
          projected: fixed + variableTotal,
          note: null,
        };
      }
      const elapsedDays = daysIntoWeek(referenceDate);
      const estimatedVariable = (variableTotal / elapsedDays) * 7;
      return {
        fixed,
        variableTotal,
        actual: fixed + variableTotal,
        projected: fixed + estimatedVariable,
        note: `Projected from ${elapsedDays} day${elapsedDays === 1 ? "" : "s"} so far this week.`,
      };
    }

    // month
    if (!current) {
      return {
        fixed: subscriptionsMonthly,
        variableTotal,
        actual: subscriptionsMonthly + variableTotal,
        projected: subscriptionsMonthly + variableTotal,
        note: null,
      };
    }
    const daysInMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      0
    ).getDate();
    const dayOfMonth = referenceDate.getDate();
    const estimatedVariable = (variableTotal / dayOfMonth) * daysInMonth;
    return {
      fixed: subscriptionsMonthly,
      variableTotal,
      actual: subscriptionsMonthly + variableTotal,
      projected: subscriptionsMonthly + estimatedVariable,
      note: `Projected from ${dayOfMonth} of ${daysInMonth} days this month.`,
    };
  }, [period, referenceDate, current, subscriptionsMonthly, expenses]);

  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">Spending</p>
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
        <span className="text-4xl font-semibold tracking-tight">
          {stats.actual.toFixed(2)}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {summaryLine(period, referenceDate, current)}
      </p>

      <div className="mt-4 flex gap-4 border-t pt-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Fixed</p>
          <p className="font-medium">
            {symbol}
            {stats.fixed.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Variable</p>
          <p className="font-medium">
            {symbol}
            {stats.variableTotal.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">
            {current ? "Projected total" : "Total"}
          </p>
          <p className="font-medium">
            {symbol}
            {stats.projected.toFixed(2)}
          </p>
          {stats.note && (
            <p className="text-muted-foreground mt-0.5 text-[11px]">{stats.note}</p>
          )}
        </div>
      </div>
    </MagicCard>
  );
}
