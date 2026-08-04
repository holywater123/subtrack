import { MagicCard } from "@/components/ui/magic-card";
import { DailyTrendChart, type DailyAmount } from "@/components/ui/daily-trend-chart";
import { currencySymbol } from "@/lib/currencies";

export function SpendingTrendCard({
  data,
  baseCurrency,
}: {
  data: DailyAmount[];
  baseCurrency: string;
}) {
  const symbol = currencySymbol(baseCurrency);
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <MagicCard className="rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">Spending trend</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Daily expenses this month
      </p>

      {total === 0 ? (
        <p className="text-muted-foreground mt-4 border-t pt-4 text-sm">
          No expenses logged yet this month.
        </p>
      ) : (
        <div className="mt-4 border-t pt-4">
          <DailyTrendChart data={data} symbol={symbol} />
        </div>
      )}
    </MagicCard>
  );
}
