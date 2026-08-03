"use client";

import { useMemo, useState } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { currencySymbol } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import type { ExpenseThisMonth } from "@/lib/finance-summary";
import {
  AVG_DAYS_PER_MONTH,
  PERIODS,
  daysIntoWeek,
  parseLocalDate,
  startOfWeek,
  type Period,
} from "@/lib/period";

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
  const symbol = currencySymbol(baseCurrency);

  const stats = useMemo(() => {
    const now = new Date();

    if (period === "day") {
      const today = now.toDateString();
      const variableSoFar = expenses
        .filter((e) => parseLocalDate(e.spentOn).toDateString() === today)
        .reduce((sum, e) => sum + e.amountBase, 0);
      const fixed = subscriptionsMonthly / AVG_DAYS_PER_MONTH;
      return {
        fixed,
        variableSoFar,
        actual: fixed + variableSoFar,
        projected: fixed + variableSoFar,
        note: "No projection for partial days - shown as spent so far.",
      };
    }

    if (period === "week") {
      const weekStart = startOfWeek(now);
      const elapsedDays = daysIntoWeek(now);
      const variableSoFar = expenses
        .filter((e) => parseLocalDate(e.spentOn) >= weekStart)
        .reduce((sum, e) => sum + e.amountBase, 0);
      const fixed = (subscriptionsMonthly * 7) / AVG_DAYS_PER_MONTH;
      const estimatedVariable = (variableSoFar / elapsedDays) * 7;
      return {
        fixed,
        variableSoFar,
        actual: fixed + variableSoFar,
        projected: fixed + estimatedVariable,
        note: `Projected from ${elapsedDays} day${elapsedDays === 1 ? "" : "s"} so far this week.`,
      };
    }

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const dayOfMonth = now.getDate();
    const variableSoFar = expenses.reduce((sum, e) => sum + e.amountBase, 0);
    const estimatedVariable = (variableSoFar / dayOfMonth) * daysInMonth;
    return {
      fixed: subscriptionsMonthly,
      variableSoFar,
      actual: subscriptionsMonthly + variableSoFar,
      projected: subscriptionsMonthly + estimatedVariable,
      note: `Projected from ${dayOfMonth} of ${daysInMonth} days this month.`,
    };
  }, [period, subscriptionsMonthly, expenses]);

  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">Spending</p>
        <div className="bg-muted flex gap-0.5 rounded-full p-0.5">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant="ghost"
              onClick={() => setPeriod(p.value)}
              className={cn(
                "h-7 rounded-full px-3 text-xs",
                period === p.value &&
                  "bg-background shadow-sm hover:bg-background"
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">{symbol}</span>
        <span className="text-4xl font-semibold tracking-tight">
          {stats.actual.toFixed(2)}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Actual spend so far this {period}
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
            {stats.variableSoFar.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Projected total</p>
          <p className="font-medium">
            {symbol}
            {stats.projected.toFixed(2)}
          </p>
          <p className="text-muted-foreground mt-0.5 text-[11px]">
            {stats.note}
          </p>
        </div>
      </div>
    </MagicCard>
  );
}
