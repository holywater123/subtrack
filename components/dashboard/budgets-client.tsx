"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import {
  AddBudgetDialog,
  type CategoryOption,
} from "@/components/dashboard/add-budget-dialog";
import { getCategory } from "@/lib/categories";
import { setBudget } from "@/app/dashboard/budgets/actions";

export interface BudgetRowData {
  categoryValue: string;
  spend: number;
  budget: number;
}

export function BudgetsClient({
  rows,
  unbudgetedCategories,
  baseCurrency,
}: {
  rows: BudgetRowData[];
  unbudgetedCategories: CategoryOption[];
  baseCurrency: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-medium">
          Your budgets
        </h2>
        {unbudgetedCategories.length > 0 && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="size-4" />
            Add budget
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No budgets set yet. Add one above to start capping a category.
        </div>
      ) : (
        rows.map((row) => (
          <BudgetRow key={row.categoryValue} row={row} baseCurrency={baseCurrency} />
        ))
      )}

      <AddBudgetDialog
        open={dialogOpen}
        categories={unbudgetedCategories}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}

function BudgetRow({
  row,
  baseCurrency,
}: {
  row: BudgetRowData;
  baseCurrency: string;
}) {
  const { spend, budget } = row;
  // Resolved client-side (rather than passed as a server prop) because a
  // Category's `icon` is a component reference, which React Server
  // Components can't serialize across the server->client prop boundary.
  const category = getCategory(row.categoryValue);
  const [value, setValue] = useState(String(budget));
  const [isPending, startTransition] = useTransition();

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("amount", value || "0");

    startTransition(async () => {
      const result = await setBudget(category.value, formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        value
          ? `Budget set for ${category.label}`
          : `Budget removed for ${category.label}`
      );
    });
  }

  return (
    <MagicCard className="rounded-xl p-4">
      <BudgetProgress
        category={category}
        spend={spend}
        budget={budget}
        baseCurrency={baseCurrency}
        trailing={
          <form
            onSubmit={handleSave}
            className="flex shrink-0 items-center gap-1.5"
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="No budget"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 w-24 text-sm"
            />
            <Button type="submit" size="sm" variant="outline" disabled={isPending}>
              Save
            </Button>
          </form>
        }
      />
    </MagicCard>
  );
}
