"use client";

import { useMemo, useState } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { currencySymbol } from "@/lib/currencies";
import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { PERIODS, isInPeriod, type Period } from "@/lib/period";

export interface BreakdownExpense {
  amountBase: number;
  category: string;
  spentOn: string;
}

const PERIOD_LABEL: Record<Period, string> = {
  day: "today",
  week: "this week",
  month: "this month",
};

export function ExpensesBreakdown({
  expenses,
  baseCurrency,
}: {
  expenses: BreakdownExpense[];
  baseCurrency: string;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const symbol = currencySymbol(baseCurrency);

  const { total, rows } = useMemo(() => {
    const now = new Date();
    const filtered = expenses.filter((e) => isInPeriod(e.spentOn, period, now));

    const byCategory: Record<string, number> = {};
    for (const e of filtered) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amountBase;
    }

    const total = filtered.reduce((sum, e) => sum + e.amountBase, 0);

    const rows = Object.entries(byCategory)
      .map(([value, amount]) => ({
        category: getCategory(value),
        amount,
        pct: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { total, rows };
  }, [expenses, period]);

  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">Spending breakdown</p>
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
          {total.toFixed(2)}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Spent {PERIOD_LABEL[period]}
      </p>

      {rows.length === 0 ? (
        <p className="text-muted-foreground mt-4 border-t pt-4 text-sm">
          No expenses logged {PERIOD_LABEL[period]}.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 border-t pt-4">
          {rows.map((row) => {
            const Icon = row.category.icon;
            return (
              <div key={row.category.value} className="flex items-center gap-3">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${row.category.color}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">
                      {row.category.label}
                    </p>
                    <p className="text-muted-foreground shrink-0 text-xs">
                      {row.pct.toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
                <p className="w-20 shrink-0 text-right text-sm font-medium">
                  {symbol}
                  {row.amount.toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </MagicCard>
  );
}
