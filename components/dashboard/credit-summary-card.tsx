import { MagicCard } from "@/components/ui/magic-card";
import { currencySymbol } from "@/lib/currencies";
import { getWalletType } from "@/lib/wallet-types";

export interface CreditSummaryRow {
  walletId: string;
  name: string;
  walletType: string;
  limit: number;
  used: number;
  available: number;
}

export function CreditSummaryCard({
  totalCreditLimit,
  totalUsed,
  totalAvailable,
  rows,
  baseCurrency,
}: {
  totalCreditLimit: number;
  totalUsed: number;
  totalAvailable: number;
  rows: CreditSummaryRow[];
  baseCurrency: string;
}) {
  const symbol = currencySymbol(baseCurrency);

  return (
    <MagicCard className="relative overflow-hidden rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">Available Credit & Pay Later</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-semibold">{symbol}</span>
        <span className="text-4xl font-semibold tracking-tight">
          {totalAvailable.toFixed(2)}
        </span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs">
        {symbol}
        {totalUsed.toFixed(2)} used of {symbol}
        {totalCreditLimit.toFixed(2)} combined limit, converted to {baseCurrency}
      </p>

      <div className="mt-4 flex flex-col gap-3 border-t pt-4">
        {rows.map((row) => {
          const type = getWalletType(row.walletType);
          const Icon = type.icon;
          const pct = row.limit !== 0 ? (row.used / row.limit) * 100 : 0;

          return (
            <div key={row.walletId} className="flex items-center gap-3">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${type.color}`}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="text-muted-foreground shrink-0 text-xs">
                    of {symbol}
                    {row.limit.toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                  />
                </div>
              </div>
              <p className="w-20 shrink-0 text-right text-sm font-medium">
                {symbol}
                {row.used.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>
    </MagicCard>
  );
}
