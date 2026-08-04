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
import type { Wallet } from "@/lib/types";
import { CURRENCY_ITEMS } from "@/lib/currencies";
import { WALLET_TYPES, isCreditWallet } from "@/lib/wallet-types";
import { addWallet, updateWallet } from "@/app/dashboard/wallets/actions";

export function WalletDialog({
  open,
  wallet,
  onOpenChange,
}: {
  open: boolean;
  wallet?: Wallet;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <WalletForm
            key={wallet?.id ?? "new"}
            wallet={wallet}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function WalletForm({
  wallet,
  onDone,
}: {
  wallet?: Wallet;
  onDone: () => void;
}) {
  const isEditing = Boolean(wallet);
  const [name, setName] = useState(wallet?.name ?? "");
  const [walletType, setWalletType] = useState(wallet?.wallet_type ?? "cash");
  const [currency, setCurrency] = useState(wallet?.currency ?? "MYR");
  const [startingBalance, setStartingBalance] = useState(
    wallet ? String(wallet.starting_balance) : "0"
  );
  const [description, setDescription] = useState(wallet?.description ?? "");
  const [statementBalance, setStatementBalance] = useState(
    wallet?.statement_balance !== null && wallet?.statement_balance !== undefined
      ? String(wallet.statement_balance)
      : ""
  );
  const [outstandingBalance, setOutstandingBalance] = useState(
    wallet?.outstanding_balance !== null && wallet?.outstanding_balance !== undefined
      ? String(wallet.outstanding_balance)
      : ""
  );
  const [creditLimit, setCreditLimit] = useState(
    wallet?.credit_limit !== null && wallet?.credit_limit !== undefined
      ? String(wallet.credit_limit)
      : ""
  );
  const [paymentDueDay, setPaymentDueDay] = useState(
    wallet?.payment_due_day !== null && wallet?.payment_due_day !== undefined
      ? String(wallet.payment_due_day)
      : ""
  );
  const [isPending, startTransition] = useTransition();
  const isCredit = isCreditWallet(walletType);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("walletType", walletType);
    formData.set("currency", currency);
    formData.set("description", description);
    formData.set("startingBalance", isCredit ? "0" : startingBalance);
    formData.set("statementBalance", isCredit ? statementBalance : "");
    formData.set("outstandingBalance", isCredit ? outstandingBalance : "");
    formData.set("creditLimit", isCredit ? creditLimit : "");
    formData.set("paymentDueDay", isCredit ? paymentDueDay : "");

    startTransition(async () => {
      const result = wallet
        ? await updateWallet(wallet.id, formData)
        : await addWallet(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(isEditing ? "Wallet updated" : "Wallet added");
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit wallet" : "Add wallet"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Maybank Savings, Touch 'n Go, Cash..."
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select
              items={WALLET_TYPES}
              value={walletType}
              onValueChange={(v) => v && setWalletType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WALLET_TYPES.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

        {isCredit ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="statementBalance">Statement balance</Label>
                <Input
                  id="statementBalance"
                  type="number"
                  step="0.01"
                  value={statementBalance}
                  onChange={(e) => setStatementBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="outstandingBalance">Outstanding balance</Label>
                <Input
                  id="outstandingBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={outstandingBalance}
                  onChange={(e) => setOutstandingBalance(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <p className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-xs leading-relaxed">
              <span className="text-foreground font-medium">
                Statement balance
              </span>{" "}
              is your last bill - pay it in full by the due date to owe zero
              interest.{" "}
              <span className="text-foreground font-medium">
                Outstanding balance
              </span>{" "}
              is what you owe right now, including anything since that bill
              - it&apos;s the number that actually reduces your available
              credit.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="creditLimit">Combined credit limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="paymentDueDay">Payment due date</Label>
                <Input
                  id="paymentDueDay"
                  type="number"
                  min="1"
                  max="31"
                  value={paymentDueDay}
                  onChange={(e) => setPaymentDueDay(e.target.value)}
                  placeholder="e.g. 15"
                />
              </div>
            </div>
            <p className="text-muted-foreground -mt-2 text-xs">
              Day of the month payment is due, every month.
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="startingBalance">Starting balance</Label>
            <Input
              id="startingBalance"
              type="number"
              step="0.01"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              required
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this account is for..."
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Add wallet"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
