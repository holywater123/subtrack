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
import type { Debt } from "@/lib/types";
import { CURRENCIES } from "@/lib/currencies";
import { DEBT_TYPES } from "@/lib/debt-types";
import { addDebt, updateDebt } from "@/app/dashboard/debts/actions";

export function DebtDialog({
  open,
  debt,
  onOpenChange,
}: {
  open: boolean;
  debt?: Debt;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <DebtForm
            key={debt?.id ?? "new"}
            debt={debt}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DebtForm({ debt, onDone }: { debt?: Debt; onDone: () => void }) {
  const isEditing = Boolean(debt);
  const [name, setName] = useState(debt?.name ?? "");
  const [debtType, setDebtType] = useState(debt?.debt_type ?? "credit_card");
  const [balance, setBalance] = useState(debt ? String(debt.balance) : "");
  const [currency, setCurrency] = useState(debt?.currency ?? "MYR");
  const [interestRate, setInterestRate] = useState(
    debt?.interest_rate !== null && debt?.interest_rate !== undefined
      ? String(debt.interest_rate)
      : ""
  );
  const [dueDate, setDueDate] = useState(debt?.due_date ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("debtType", debtType);
    formData.set("balance", balance);
    formData.set("currency", currency);
    formData.set("interestRate", interestRate);
    formData.set("dueDate", dueDate);

    startTransition(async () => {
      const result = debt
        ? await updateDebt(debt.id, formData)
        : await addDebt(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(isEditing ? "Debt updated" : "Debt added");
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit debt" : "Add debt"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Maybank Credit Card, Shopee SPayLater..."
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Type</Label>
          <Select value={debtType} onValueChange={(v) => v && setDebtType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEBT_TYPES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              type="number"
              min="0"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
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
            <Label htmlFor="interestRate">Interest rate % (optional)</Label>
            <Input
              id="interestRate"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 18"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="dueDate">Due date (optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Save changes" : "Add debt"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
