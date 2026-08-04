"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IncomeRow } from "@/components/dashboard/income-row";
import { IncomeDialog } from "@/components/dashboard/income-dialog";
import { PERIODS_WITH_YEAR, isInPeriod, type Period } from "@/lib/period";
import type { Income, Wallet } from "@/lib/types";

const PERIOD_ITEMS: { value: Period | "all"; label: string }[] = [
  { value: "all", label: "All time" },
  ...PERIODS_WITH_YEAR,
];

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
  const [period, setPeriod] = useState<Period | "all">("all");

  const visibleIncome = useMemo(() => {
    if (period === "all") return income;
    const now = new Date();
    return income.filter((i) => isInPeriod(i.received_on, period, now));
  }, [income, period]);

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

      {income.length > 0 && (
        <Select
          items={PERIOD_ITEMS}
          value={period}
          onValueChange={(v) => v && setPeriod(v as Period | "all")}
        >
          <SelectTrigger className="w-auto min-w-32 self-start">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_ITEMS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {income.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No income logged yet. Add a side gig payout, a repayment from a
          friend, anything coming in.
        </div>
      ) : visibleIncome.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No income matches this filter.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleIncome.map((entry) => (
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
