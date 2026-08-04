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
import type { BalanceTransfer } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { payInstallment } from "@/app/dashboard/wallets/actions";

export function PayInstallmentDialog({
  open,
  transfer,
  onOpenChange,
}: {
  open: boolean;
  transfer: BalanceTransfer;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <PayInstallmentForm
            key={transfer.id}
            transfer={transfer}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PayInstallmentForm({
  transfer,
  onDone,
}: {
  transfer: BalanceTransfer;
  onDone: () => void;
}) {
  const symbol = currencySymbol(transfer.currency);
  const monthsLeft = Math.max(0, transfer.term_months - transfer.installments_paid);
  const monthlyInstallment =
    transfer.term_months > 0
      ? (transfer.original_amount + transfer.total_interest) / transfer.term_months
      : 0;
  const defaultAmount = Math.min(monthlyInstallment, transfer.remaining_balance);
  const [amount, setAmount] = useState(
    defaultAmount > 0 ? defaultAmount.toFixed(2) : ""
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("amount", amount);

    startTransition(async () => {
      const result = await payInstallment(transfer.id, formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      const paid = Number(amount) || 0;
      const remaining = Math.max(0, transfer.remaining_balance - paid);
      toast.success(
        remaining === 0
          ? `${transfer.name ?? "Balance transfer"} paid off!`
          : `Installment recorded - ${symbol}${remaining.toFixed(2)} left`
      );
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Pay {transfer.name ?? "installment"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Payment amount</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            max={transfer.remaining_balance || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <p className="text-muted-foreground text-xs">
            Remaining balance: {symbol}
            {transfer.remaining_balance.toFixed(2)} - {monthsLeft} month
            {monthsLeft === 1 ? "" : "s"} left - usual installment {symbol}
            {monthlyInstallment.toFixed(2)}
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
