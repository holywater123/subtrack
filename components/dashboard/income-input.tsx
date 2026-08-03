"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { currencySymbol } from "@/lib/currencies";
import { setMonthlyIncome } from "@/app/dashboard/debts/actions";

export function IncomeInput({
  monthlyIncome,
  baseCurrency,
}: {
  monthlyIncome: number | null;
  baseCurrency: string;
}) {
  const [value, setValue] = useState(
    monthlyIncome !== null ? String(monthlyIncome) : ""
  );
  const [isPending, startTransition] = useTransition();

  function handleSave(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("income", value || "0");

    startTransition(async () => {
      const result = await setMonthlyIncome(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Monthly income updated");
    });
  }

  return (
    <MagicCard className="rounded-xl p-4">
      <form
        onSubmit={handleSave}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="income">
            Monthly income ({currencySymbol(baseCurrency)})
          </Label>
          <Input
            id="income"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 5000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" disabled={isPending}>
          Save
        </Button>
      </form>
    </MagicCard>
  );
}
