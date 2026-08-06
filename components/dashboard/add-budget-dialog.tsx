"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setBudget } from "@/app/dashboard/budgets/actions";

export interface CategoryOption {
  value: string;
  label: string;
}

export function AddBudgetDialog({
  open,
  categories,
  onOpenChange,
}: {
  open: boolean;
  categories: CategoryOption[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <AddBudgetForm
            key={categories.map((c) => c.value).join(",")}
            categories={categories}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AddBudgetForm({
  categories,
  onDone,
}: {
  categories: CategoryOption[];
  onDone: () => void;
}) {
  const [category, setCategory] = useState(categories[0]?.value ?? "");
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!category) {
      toast.error("Choose a category.");
      return;
    }
    // Unlike the edit row (where clearing to 0 intentionally removes a
    // budget), 0 has no useful meaning when adding - setBudget treats an
    // amount of 0 as a delete, which would silently no-op here and still
    // report success for a budget that was never actually set.
    const parsedAmount = Number(amount);
    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Enter a budget amount above 0.");
      return;
    }
    const formData = new FormData();
    formData.set("amount", amount);

    startTransition(async () => {
      const result = await setBudget(category, formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const label = categories.find((c) => c.value === category)?.label ?? category;
      toast.success(`Budget set for ${label}`);
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add budget</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Every category already has a budget set.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                items={categories}
                value={category}
                onValueChange={(v) => v && setCategory(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-amount">Monthly budget</Label>
              <Input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </>
        )}

        <DialogFooter>
          <Button type="submit" disabled={isPending || categories.length === 0}>
            {isPending ? "Saving..." : "Add budget"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
