"use client";

import { useMemo, useState } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { TrendBarChart, type TrendBar } from "@/components/ui/trend-bar-chart";
import { currencySymbol } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { parseLocalDate, startOfMonth, startOfWeek } from "@/lib/period";

export interface TrendExpense {
  amountBase: number;
  spentOn: string;
}

type TrendPeriod = "week" | "month" | "year";

const PERIOD_ITEMS: { value: TrendPeriod; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildBars(expenses: TrendExpense[], period: TrendPeriod): TrendBar[] {
  const now = new Date();

  if (period === "year") {
    const monthTotals = new Array(now.getMonth() + 1).fill(0);
    for (const e of expenses) {
      const d = parseLocalDate(e.spentOn);
      if (d.getFullYear() === now.getFullYear() && d.getMonth() <= now.getMonth()) {
        monthTotals[d.getMonth()] += e.amountBase;
      }
    }
    return monthTotals.map((amount, i) => ({
      key: String(i),
      label: MONTH_LABELS[i],
      amount,
      tooltipLabel: MONTH_FULL[i],
    }));
  }

  const start = period === "week" ? startOfWeek(now) : startOfMonth(now);
  const byDay = new Map<string, number>();
  for (const e of expenses) {
    const d = parseLocalDate(e.spentOn);
    if (d >= start && d <= now) {
      const key = toKey(d);
      byDay.set(key, (byDay.get(key) ?? 0) + e.amountBase);
    }
  }

  const days: Date[] = [];
  for (
    let d = new Date(start);
    d.getTime() <= now.getTime();
    d.setDate(d.getDate() + 1)
  ) {
    days.push(new Date(d));
  }

  return days.map((d) => ({
    key: toKey(d),
    label:
      period === "week"
        ? WEEKDAY_LABELS[(d.getDay() + 6) % 7]
        : String(d.getDate()),
    amount: byDay.get(toKey(d)) ?? 0,
    tooltipLabel:
      period === "week"
        ? `${WEEKDAY_LABELS[(d.getDay() + 6) % 7]} ${d.getDate()}`
        : `Day ${d.getDate()}`,
  }));
}

export function SpendingTrendCard({
  expenses,
  baseCurrency,
}: {
  expenses: TrendExpense[];
  baseCurrency: string;
}) {
  const [period, setPeriod] = useState<TrendPeriod>("month");
  const symbol = currencySymbol(baseCurrency);

  const bars = useMemo(() => buildBars(expenses, period), [expenses, period]);
  const total = bars.reduce((sum, b) => sum + b.amount, 0);

  return (
    <MagicCard className="rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Spending trend</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Expenses this {period}
          </p>
        </div>
        <div className="bg-muted flex gap-0.5 rounded-full p-0.5">
          {PERIOD_ITEMS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant="ghost"
              onClick={() => setPeriod(p.value)}
              className={cn(
                "h-7 rounded-full px-3 text-xs",
                period === p.value && "bg-background shadow-sm hover:bg-background"
              )}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground mt-4 border-t pt-4 text-sm">
          No expenses logged this {period}.
        </p>
      ) : (
        <div className="mt-4 border-t pt-4">
          <TrendBarChart data={bars} symbol={symbol} sparseLabels={period === "month"} />
        </div>
      )}
    </MagicCard>
  );
}
