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
import type { Income, Wallet } from "@/lib/types";
import { CURRENCY_ITEMS } from "@/lib/currencies";
import { INCOME_CATEGORIES } from "@/lib/income-categories";
import { addIncome, updateIncome } from "@/app/dashboard/income/actions";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function IncomeDialog({
  open,
  income,
  wallets,
  defaultCurrency,
  onOpenChange,
}: {
  open: boolean;
  income?: Income;
  wallets: Wallet[];
  defaultCurrency?: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <IncomeForm
            key={income?.id ?? "new"}
            income={income}
            wallets={wallets}
            defaultCurrency={defaultCurrency}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function IncomeForm({
  income,
  wallets,
  defaultCurrency,
  onDone,
}: {
  income?: Income;
  wallets: Wallet[];
  defaultCurrency?: string;
  onDone: () => void;
}) {
  const isEditing = Boolean(income);
  const [amount, setAmount] = useState(income ? String(income.amount) : "");
  const [currency, setCurrency] = useState(
    income?.currency ?? defaultCurrency ?? "MYR"
  );
  const [category, setCategory] = useState(income?.category ?? "other");
  const [receivedOn, setReceivedOn] = useState(income?.received_on ?? today());
  const [note, setNote] = useState(income?.note ?? "");
  const cashPoolWallet = wallets.find((w) => w.is_cash_pool);
  const [walletId, setWalletId] = useState(
    income?.wallet_id ?? cashPoolWallet?.id ?? "none"
  );
  const [isPending, startTransition] = useTransition();

  const walletItems = [
    { value: "none", label: "Unassigned" },
    ...wallets.map((w) => ({
      value: w.id,
      label: w.is_cash_pool ? `${w.name} (Cash pool)` : w.name,
    })),
  ];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("amount", amount);
    formData.set("currency", currency);
    formData.set("category", category);
    formData.set("receivedOn", receivedOn);
    formData.set("note", note);
    formData.set("walletId", walletId);

    startTransition(async () => {
      const result = income
        ? await updateIncome(income.id, formData)
        : await addIncome(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(isEditing ? "Income updated" : "Income added");
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit income" : "Add income"}</DialogTitle>
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
              items={CURRENCY_ITEMS}
              value={currency}
              onValueChange={(v) => v && setCurrency(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_ITEMS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
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
              items={INCOME_CATEGORIES}
              value={category}
              onValueChange={(v) => v && setCategory(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INCOME_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="receivedOn">Date</Label>
            <Input
              id="receivedOn"
              type="date"
              value={receivedOn}
              onChange={(e) => setReceivedOn(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Wallet</Label>
          {!isEditing && cashPoolWallet ? (
            <div className="border-input bg-muted/30 text-muted-foreground flex h-8 items-center rounded-lg border px-2.5 text-sm">
              Goes into {cashPoolWallet.name} (cash pool) - use Transfer on
              the Wallets tab to move it elsewhere later.
            </div>
          ) : (
            <Select
              items={walletItems}
              value={walletId}
              onValueChange={(v) => v && setWalletId(v)}
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
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Freelance gig, John paid back lunch..."
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Add income"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
