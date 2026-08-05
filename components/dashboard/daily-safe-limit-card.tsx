"use client";

import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { currencySymbol } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import type { DailySafeLimitResult } from "@/lib/daily-safe-limit";

const STATUS_COPY: Record<
  Exclude<DailySafeLimitResult["status"], "no-income">,
  { label: string; dot: string }
> = {
  green: { label: "On track", dot: "bg-emerald-500" },
  yellow: { label: "Slow down", dot: "bg-amber-500" },
  red: { label: "Pause spending", dot: "bg-red-500" },
};

// The hero metric: how much is genuinely safe to spend per day for the
// rest of the month, so the cost of spending is visible before it
// happens - not a shock after a statement shows up.
export function DailySafeLimitCard({
  result,
  baseCurrency,
}: {
  result: DailySafeLimitResult;
  baseCurrency: string;
}) {
  const symbol = currencySymbol(baseCurrency);

  if (result.status === "no-income") {
    return (
      <MagicCard className="relative overflow-hidden rounded-2xl p-6">
        <p className="text-muted-foreground text-sm">Daily safe limit</p>
        <p className="text-muted-foreground mt-4 text-sm">
          Log income to see your daily safe limit.
        </p>
      </MagicCard>
    );
  }

  const status = STATUS_COPY[result.status];

  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">Daily safe limit</p>
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium">
          <span className={cn("size-2 rounded-full", status.dot)} />
          {status.label}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">{symbol}</span>
        <NumberTicker
          value={result.dailyLimit}
          decimalPlaces={2}
          className="text-4xl font-semibold tracking-tight"
        />
        <span className="text-muted-foreground text-sm">/day</span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {symbol}
        {result.remainingBudget.toFixed(2)} left over {result.remainingDays}{" "}
        day{result.remainingDays === 1 ? "" : "s"} left this month, based on
        income logged, real spending so far, and upcoming subscriptions.
      </p>
      {result.usedEstimatedIncome && (
        <p className="text-muted-foreground mt-1 text-xs">
          Estimated from last month&apos;s income - none logged yet this
          month.
        </p>
      )}
    </MagicCard>
  );
}
