import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { BorderBeam } from "@/components/ui/border-beam";

export function TotalSpendCard({
  totalMonthly,
  count,
}: {
  totalMonthly: number;
  count: number;
}) {
  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <BorderBeam size={120} duration={8} colorFrom="#9E7AFF" colorTo="#FE8BBB" />
      <p className="text-muted-foreground text-sm">Total per month</p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">$</span>
        <NumberTicker
          value={totalMonthly}
          decimalPlaces={2}
          className="text-4xl font-semibold tracking-tight"
        />
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Across {count} subscription{count === 1 ? "" : "s"}
      </p>
    </MagicCard>
  );
}
