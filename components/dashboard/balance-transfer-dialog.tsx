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
import type { Wallet } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { createBalanceTransfer } from "@/app/dashboard/wallets/actions";

export function BalanceTransferDialog({
  open,
  wallet,
  onOpenChange,
}: {
  open: boolean;
  wallet: Wallet;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <BalanceTransferForm
            key={wallet.id}
            wallet={wallet}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function BalanceTransferForm({
  wallet,
  onDone,
}: {
  wallet: Wallet;
  onDone: () => void;
}) {
  const symbol = currencySymbol(wallet.currency);
  const outstanding = wallet.outstanding_balance ?? 0;
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(outstanding ? String(outstanding) : "");
  const [termMonths, setTermMonths] = useState("12");
  const [totalInterest, setTotalInterest] = useState("");
  const [isPending, startTransition] = useTransition();

  const amountNum = Number(amount) || 0;
  const interestNum = Number(totalInterest) || 0;
  const termNum = Number(termMonths) || 0;
  const monthly = termNum > 0 ? (amountNum + interestNum) / termNum : 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("amount", amount);
    formData.set("termMonths", termMonths);
    formData.set("totalInterest", totalInterest);

    startTransition(async () => {
      const result = await createBalanceTransfer(wallet.id, formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Balance transfer created");
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Convert {wallet.name} to a balance transfer</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Plan name (optional)</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="0% Installment Plan"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount to move</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            max={outstanding || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <p className="text-muted-foreground text-xs">
            Outstanding balance: {symbol}
            {outstanding.toFixed(2)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="termMonths">Term (months)</Label>
            <Input
              id="termMonths"
              type="number"
              min="1"
              step="1"
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="totalInterest">Total interest (optional)</Label>
            <Input
              id="totalInterest"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={totalInterest}
              onChange={(e) => setTotalInterest(e.target.value)}
            />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          ≈ {symbol}
          {monthly.toFixed(2)} per month
        </p>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Converting..." : "Convert to balance transfer"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
