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
import type { DebtListItem } from "@/lib/debt-list";
import type { Wallet } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { payDebt } from "@/app/dashboard/debts/actions";

export function PayDebtDialog({
  open,
  item,
  sourceWallets,
  onOpenChange,
}: {
  open: boolean;
  item: DebtListItem;
  sourceWallets: Wallet[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <PayDebtForm
            key={`${item.kind}-${item.id}`}
            item={item}
            sourceWallets={sourceWallets}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PayDebtForm({
  item,
  sourceWallets,
  onDone,
}: {
  item: DebtListItem;
  sourceWallets: Wallet[];
  onDone: () => void;
}) {
  const symbol = currencySymbol(item.currency);
  const defaultWalletId =
    sourceWallets.find((w) => w.is_cash_pool)?.id ?? sourceWallets[0]?.id ?? "";
  const [sourceWalletId, setSourceWalletId] = useState(defaultWalletId);
  const [amount, setAmount] = useState("");
  const [interestAmount, setInterestAmount] = useState("");
  const [isPending, startTransition] = useTransition();

  const walletItems = sourceWallets.map((w) => ({
    value: w.id,
    label: `${w.name} (${currencySymbol(w.currency)})`,
  }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("amount", amount);
    formData.set("interestAmount", interestAmount);
    formData.set("sourceWalletId", sourceWalletId);

    startTransition(async () => {
      const result = await payDebt(item.kind, item.id, formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      const paid = Number(amount) || 0;
      const remaining = Math.max(0, item.balance - paid);
      toast.success(
        remaining === 0
          ? `${item.name} paid off!`
          : `Payment recorded - ${symbol}${remaining.toFixed(2)} left on ${item.name}`
      );
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Pay {item.name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {walletItems.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Add a bank, e-wallet, or cash wallet first - payments need an
            account to come out of.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <Label>Pay from</Label>
            <Select
              items={walletItems}
              value={sourceWalletId}
              onValueChange={(v) => v && setSourceWalletId(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {walletItems.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Payment amount</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            max={item.balance || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <p className="text-muted-foreground text-xs">
            Current balance: {symbol}
            {item.balance.toFixed(2)}
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
          <Button type="submit" disabled={isPending || !sourceWalletId}>
            {isPending ? "Recording..." : "Record payment"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
