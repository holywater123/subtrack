import type { ReactNode } from "react";
import { currencySymbol } from "@/lib/currencies";
import type { Category } from "@/lib/categories";

export function BudgetProgress({
  category,
  spend,
  budget,
  baseCurrency,
  trailing,
}: {
  category: Category;
  spend: number;
  budget: number | null;
  baseCurrency: string;
  trailing?: ReactNode;
}) {
  const Icon = category.icon;
  const symbol = currencySymbol(baseCurrency);
  const pct = budget ? Math.min(100, (spend / budget) * 100) : 0;
  const isOver = budget !== null && spend > budget;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white ${category.color}`}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{category.label}</p>
        <p className="text-muted-foreground text-xs">
          {symbol}
          {spend.toFixed(2)} spent this month
          {budget !== null && ` of ${symbol}${budget.toFixed(2)}`}
        </p>
        {budget !== null && (
          <div className="bg-muted mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className={`h-full rounded-full ${isOver ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      {trailing}
    </div>
  );
}
