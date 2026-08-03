"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseRow } from "@/components/dashboard/expense-row";
import { ExpenseDialog } from "@/components/dashboard/expense-dialog";
import {
  ExpensesBreakdown,
  type BreakdownExpense,
} from "@/components/dashboard/expenses-breakdown";
import type { Expense } from "@/lib/types";

export function ExpensesClient({
  expenses,
  breakdownExpenses,
  baseCurrency,
}: {
  expenses: Expense[];
  breakdownExpenses: BreakdownExpense[];
  baseCurrency: string;
}) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    expense?: Expense;
  }>({ open: false });

  return (
    <div className="flex flex-col gap-6">
      <ExpensesBreakdown expenses={breakdownExpenses} baseCurrency={baseCurrency} />

      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-medium">
          Recent expenses
        </h2>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setDialogState({ open: true })}
        >
          <Plus className="size-4" />
          Add expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No expenses logged yet. Add your first one - lunch, petrol,
          groceries, anything.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {expenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onEdit={() => setDialogState({ open: true, expense })}
            />
          ))}
        </div>
      )}

      <ExpenseDialog
        open={dialogState.open}
        expense={dialogState.expense}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
      />
    </div>
  );
}
