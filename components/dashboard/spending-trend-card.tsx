"use client";

import { useMemo, useState } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { TrendBarChart, type TrendBar } from "@/components/ui/trend-bar-chart";
import { PeriodPicker } from "@/components/ui/period-picker";
import { currencySymbol } from "@/lib/currencies";
import {
  parseLocalDate,
  periodEnd,
  periodStart,
  type Period,
} from "@/lib/period";

export interface TrendExpense {
  amountBase: number;
  spentOn: string;
}

// No "day" option here - a single-bar "trend" isn't meaningful.
const TREND_PERIODS: { value: Period; label: string }[] = [
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

function buildBars(
  expenses: TrendExpense[],
  period: Period,
  referenceDate: Date
): TrendBar[] {
  if (period === "year") {
    const year = referenceDate.getFullYear();
    const monthTotals = new Array(12).fill(0);
    for (const e of expenses) {
      const d = parseLocalDate(e.spentOn);
      if (d.getFullYear() === year) monthTotals[d.getMonth()] += e.amountBase;
    }
    return monthTotals.map((amount, i) => ({
      key: String(i),
      label: MONTH_LABELS[i],
      amount,
      tooltipLabel: MONTH_FULL[i],
    }));
  }

  const start = periodStart(period, referenceDate);
  const end = periodEnd(period, referenceDate);
  const byDay = new Map<string, number>();
  for (const e of expenses) {
    const d = parseLocalDate(e.spentOn);
    if (d >= start && d < end) {
      const key = toKey(d);
      byDay.set(key, (byDay.get(key) ?? 0) + e.amountBase);
    }
  }

  const days: Date[] = [];
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
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
  const [period, setPeriod] = useState<Period>("month");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const symbol = currencySymbol(baseCurrency);

  const bars = useMemo(
    () => buildBars(expenses, period, referenceDate),
    [expenses, period, referenceDate]
  );
  const total = bars.reduce((sum, b) => sum + b.amount, 0);

  return (
    <MagicCard className="rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">Spending trend</p>
      <div className="mt-2">
        <PeriodPicker
          period={period}
          referenceDate={referenceDate}
          onPeriodChange={setPeriod}
          onReferenceDateChange={setReferenceDate}
          periods={TREND_PERIODS}
        />
      </div>

      {total === 0 ? (
        <p className="text-muted-foreground mt-4 border-t pt-4 text-sm">
          No expenses logged this period.
        </p>
      ) : (
        <div className="mt-4 border-t pt-4">
          <TrendBarChart data={bars} symbol={symbol} sparseLabels={period === "month"} />
        </div>
      )}
    </MagicCard>
  );
}
