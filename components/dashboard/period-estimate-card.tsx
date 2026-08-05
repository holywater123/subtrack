"use client";

import { useMemo, useState } from "react";
import { MagicCard } from "@/components/ui/magic-card";
import { PeriodPicker } from "@/components/ui/period-picker";
import { currencySymbol } from "@/lib/currencies";
import type { ExpenseThisMonth } from "@/lib/finance-summary";
import {
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

// Headline is strictly real expenses - no subscription-price formula
// blending. A subscription's cost only ever appears here once it's
// actually billed (a real expenses row). Unbilled subscription cost is a
// separate, forward-looking figure - see lib/daily-safe-limit.ts.
export function PeriodEstimateCard({
  expenses,
  baseCurrency,
}: {
  expenses: ExpenseThisMonth[];
  baseCurrency: string;
}) {
  const [period, setPeriod] = useState<Period>("month");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const symbol = currencySymbol(baseCurrency);
  const current = isCurrentPeriod(period, referenceDate);

  const stats = useMemo(() => {
    const spent = expenses
      .filter((e) => isInPeriodRange(e.spentOn, period, referenceDate))
      .reduce((sum, e) => sum + e.amountBase, 0);

    if (!current || period === "day") {
      // A day has no meaningful pace to project - it just ends at
      // midnight - and a past/future period is already a final total.
      return { spent, projected: null as number | null, note: null as string | null };
    }

    if (period === "week") {
      const elapsedDays = daysIntoWeek(referenceDate);
      const projected = (spent / elapsedDays) * 7;
      return {
        spent,
        projected,
        note: `Projected from ${elapsedDays} day${elapsedDays === 1 ? "" : "s"} so far this week.`,
      };
    }

    // month
    const daysInMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      0
    ).getDate();
    const dayOfMonth = referenceDate.getDate();
    const projected = (spent / dayOfMonth) * daysInMonth;
    return {
      spent,
      projected,
      note: `Projected from ${dayOfMonth} of ${daysInMonth} days this month.`,
    };
  }, [period, referenceDate, current, expenses]);

  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">Spent</p>
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
          {stats.spent.toFixed(2)}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {summaryLine(period, referenceDate, current)}
      </p>

      {stats.projected !== null && (
        <div className="mt-4 border-t pt-4 text-sm">
          <p className="text-muted-foreground text-xs">Pace-projected total</p>
          <p className="font-medium">
            {symbol}
            {stats.projected.toFixed(2)}
          </p>
          {stats.note && (
            <p className="text-muted-foreground mt-0.5 text-xs">{stats.note}</p>
          )}
        </div>
      )}
    </MagicCard>
  );
}
