"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TotalSpendCard } from "@/components/dashboard/total-spend-card";
import { DebtRow } from "@/components/dashboard/debt-row";
import { DebtDialog } from "@/components/dashboard/debt-dialog";
import type { DebtListItem } from "@/lib/debt-list";
import type { Debt, Wallet } from "@/lib/types";

export function DebtsClient({
  items,
  totalDebt,
  baseCurrency,
  sourceWallets,
}: {
  items: DebtListItem[];
  totalDebt: number;
  baseCurrency: string;
  sourceWallets: Wallet[];
}) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    debt?: Debt;
  }>({ open: false });

  return (
    <div className="flex flex-col gap-6">
      <TotalSpendCard
        label="Total debt"
        totalMonthly={totalDebt}
        subtitle={`Across ${items.length} debt${items.length === 1 ? "" : "s"}, including credit cards and Pay Later - converted to ${baseCurrency}`}
        baseCurrency={baseCurrency}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-medium">
          Your debts
        </h2>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setDialogState({ open: true })}
        >
          <Plus className="size-4" />
          Add debt
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No debts logged yet. Add a credit card, SPayLater, or loan to start
          tracking.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <DebtRow
              key={`${item.kind}-${item.id}`}
              item={item}
              sourceWallets={sourceWallets}
              onEdit={
                item.kind === "debt"
                  ? () => setDialogState({ open: true, debt: item.source as Debt })
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <DebtDialog
        open={dialogState.open}
        debt={dialogState.debt}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
      />
    </div>
  );
}
