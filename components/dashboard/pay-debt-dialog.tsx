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
import type { Debt } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { payDebt } from "@/app/dashboard/debts/actions";

export function PayDebtDialog({
  open,
  debt,
  onOpenChange,
}: {
  open: boolean;
  debt: Debt;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <PayDebtForm
            key={debt.id}
            debt={debt}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PayDebtForm({ debt, onDone }: { debt: Debt; onDone: () => void }) {
  const symbol = currencySymbol(debt.currency);
  const [amount, setAmount] = useState("");
  const [interestAmount, setInterestAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("amount", amount);
    formData.set("interestAmount", interestAmount);

    startTransition(async () => {
      const result = await payDebt(debt.id, formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      const paid = Number(amount) || 0;
      const remaining = Math.max(0, debt.balance - paid);
      toast.success(
        remaining === 0
          ? `${debt.name} paid off!`
          : `Payment recorded - ${symbol}${remaining.toFixed(2)} left on ${debt.name}`
      );
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Pay {debt.name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Payment amount</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            max={debt.balance || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <p className="text-muted-foreground text-xs">
            Current balance: {symbol}
            {debt.balance.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="interestAmount">Interest amount (optional)</Label>
          <Input
            id="interestAmount"
            type="number"
            min="0"
            step="0.01"
            max={amount || undefined}
            placeholder="0.00"
            value={interestAmount}
            onChange={(e) => setInterestAmount(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            If part of this payment covers interest, we&apos;ll log it as a
            Finance expense so your spending stays accurate.
          </p>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Recording..." : "Record payment"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
