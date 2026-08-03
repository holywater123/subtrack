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
import type { Expense } from "@/lib/types";
import { CURRENCIES } from "@/lib/currencies";
import { CATEGORIES } from "@/lib/categories";
import { addExpense, updateExpense } from "@/app/dashboard/expenses/actions";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseDialog({
  open,
  expense,
  onOpenChange,
}: {
  open: boolean;
  expense?: Expense;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <ExpenseForm
            key={expense?.id ?? "new"}
            expense={expense}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({
  expense,
  onDone,
}: {
  expense?: Expense;
  onDone: () => void;
}) {
  const isEditing = Boolean(expense);
  const [amount, setAmount] = useState(
    expense ? String(expense.amount) : ""
  );
  const [currency, setCurrency] = useState(expense?.currency ?? "MYR");
  const [category, setCategory] = useState(expense?.category ?? "other");
  const [spentOn, setSpentOn] = useState(expense?.spent_on ?? today());
  const [note, setNote] = useState(expense?.note ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("amount", amount);
    formData.set("currency", currency);
    formData.set("category", category);
    formData.set("spentOn", spentOn);
    formData.set("note", note);

    startTransition(async () => {
      const result = expense
        ? await updateExpense(expense.id, formData)
        : await addExpense(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(isEditing ? "Expense updated" : "Expense added");
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit expense" : "Add expense"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Currency</Label>
            <Select
              value={currency}
              onValueChange={(v) => v && setCurrency(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => v && setCategory(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="spentOn">Date</Label>
            <Input
              id="spentOn"
              type="date"
              value={spentOn}
              onChange={(e) => setSpentOn(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Lunch with friends, petrol top-up..."
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Add expense"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
