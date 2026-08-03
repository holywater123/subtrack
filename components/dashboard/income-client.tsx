"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncomeRow } from "@/components/dashboard/income-row";
import { IncomeDialog } from "@/components/dashboard/income-dialog";
import type { Income, Wallet } from "@/lib/types";

export function IncomeClient({
  income,
  wallets,
}: {
  income: Income[];
  wallets: Wallet[];
}) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    income?: Income;
  }>({ open: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-medium">
          Recent income
        </h2>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setDialogState({ open: true })}
        >
          <Plus className="size-4" />
          Add income
        </Button>
      </div>

      {income.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No income logged yet. Add a side gig payout, a repayment from a
          friend, anything coming in.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {income.map((entry) => (
            <IncomeRow
              key={entry.id}
              income={entry}
              wallets={wallets}
              onEdit={() => setDialogState({ open: true, income: entry })}
            />
          ))}
        </div>
      )}

      <IncomeDialog
        open={dialogState.open}
        income={dialogState.income}
        wallets={wallets}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
      />
    </div>
  );
}
