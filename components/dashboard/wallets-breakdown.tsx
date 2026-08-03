import { HelpCircle } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { currencySymbol } from "@/lib/currencies";
import { getWalletType } from "@/lib/wallet-types";

export interface WalletTypeBreakdownRow {
  walletType: string;
  amount: number;
  pct: number;
}

export function WalletsBreakdown({
  totalCashOnHand,
  typeBreakdown,
  baseCurrency,
}: {
  totalCashOnHand: number;
  typeBreakdown: WalletTypeBreakdownRow[];
  baseCurrency: string;
}) {
  const symbol = currencySymbol(baseCurrency);

  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">Total cash on hand</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">{symbol}</span>
        <span className="text-4xl font-semibold tracking-tight">
          {totalCashOnHand.toFixed(2)}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        Across all wallets, converted to {baseCurrency}
      </p>

      {typeBreakdown.length === 0 ? (
        <p className="text-muted-foreground mt-4 border-t pt-4 text-sm">
          Add a wallet to see how your cash is split by account type.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 border-t pt-4">
          {typeBreakdown.map((row) => {
            const isUnassigned = row.walletType === "unassigned";
            const type = isUnassigned ? null : getWalletType(row.walletType);
            const Icon = type?.icon ?? HelpCircle;
            const color = type?.color ?? "bg-gray-400";
            const label = isUnassigned ? "Unassigned" : type!.label;

            return (
              <div key={row.walletType} className="flex items-center gap-3">
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${color}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{label}</p>
                    <p className="text-muted-foreground shrink-0 text-xs">
                      {row.pct.toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, row.pct))}%` }}
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
