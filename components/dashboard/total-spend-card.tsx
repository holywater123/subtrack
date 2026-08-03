import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { currencySymbol } from "@/lib/currencies";

export function TotalSpendCard({
  label = "Total per month",
  totalMonthly,
  subtitle,
  baseCurrency,
}: {
  label?: string;
  totalMonthly: number;
  subtitle: string;
  baseCurrency: string;
}) {
  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">{label}</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">
          {currencySymbol(baseCurrency)}
        </span>
        <NumberTicker
          value={totalMonthly}
          decimalPlaces={2}
          className="text-4xl font-semibold tracking-tight"
        />
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
    </MagicCard>
  );
}
