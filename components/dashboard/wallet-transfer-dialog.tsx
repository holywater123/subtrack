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
import { addTransfer } from "@/app/dashboard/wallets/actions";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function WalletTransferDialog({
  open,
  wallets,
  onOpenChange,
}: {
  open: boolean;
  wallets: Wallet[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <TransferForm
            key="transfer"
            wallets={wallets}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransferForm({
  wallets,
  onDone,
}: {
  wallets: Wallet[];
  onDone: () => void;
}) {
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id ?? "");
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("MYR");
  const [transferredOn, setTransferredOn] = useState(today());
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const walletItems = wallets.map((w) => ({ value: w.id, label: w.name }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("fromWalletId", fromWalletId);
    formData.set("toWalletId", toWalletId);
    formData.set("amount", amount);
    formData.set("currency", currency);
    formData.set("transferredOn", transferredOn);
    formData.set("note", note);

    startTransition(async () => {
      const result = await addTransfer(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Transfer recorded");
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Transfer between wallets</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>From</Label>
            <Select
              items={walletItems}
              value={fromWalletId}
              onValueChange={(v) => v && setFromWalletId(v)}
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
          <div className="flex flex-col gap-2">
            <Label>To</Label>
            <Select
              items={walletItems}
              value={toWalletId}
              onValueChange={(v) => v && setToWalletId(v)}
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
        </div>
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="transferredOn">Date</Label>
          <Input
            id="transferredOn"
            type="date"
            value={transferredOn}
            onChange={(e) => setTransferredOn(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sorting salary into savings..."
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending || !fromWalletId || !toWalletId}>
            {isPending ? "Saving..." : "Transfer"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
