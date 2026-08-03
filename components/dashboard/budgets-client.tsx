"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { getCategory } from "@/lib/categories";
import { setBudget } from "@/app/dashboard/budgets/actions";

export interface BudgetRowData {
  categoryValue: string;
  spend: number;
  budget: number | null;
}

export function BudgetsClient({
  rows,
  baseCurrency,
}: {
  rows: BudgetRowData[];
  baseCurrency: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <BudgetRow
          key={row.categoryValue}
          row={row}
          baseCurrency={baseCurrency}
        />
      ))}
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
  const [value, setValue] = useState(budget !== null ? String(budget) : "");
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
