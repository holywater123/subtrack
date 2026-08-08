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
import { reconcileWallet } from "@/app/dashboard/wallets/actions";

// Occasional manual fix-up, not a regular workflow - there's realistically
// never 100% parity between the computed balance and a real account (bank
// fees, a forgotten cash transaction, rounding). The user types what their
// account actually shows; the difference from what this app currently
// computes becomes a single logged adjustment, not a silent overwrite.
export function ReconcileWalletDialog({
  open,
  wallet,
  currentBalance,
  onOpenChange,
}: {
  open: boolean;
  wallet: Wallet;
  currentBalance: number;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <ReconcileForm
            key={wallet.id}
            wallet={wallet}
            currentBalance={currentBalance}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReconcileForm({
  wallet,
  currentBalance,
  onDone,
}: {
  wallet: Wallet;
  currentBalance: number;
  onDone: () => void;
}) {
  const symbol = currencySymbol(wallet.currency);
  const [targetBalance, setTargetBalance] = useState(currentBalance.toFixed(2));
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  // `Number("")` is 0, not NaN - an empty/blank field (e.g. mid-edit, after
  // selecting all and deleting to retype) must not be read as "target
  // balance is zero", which would otherwise show a false full-wipeout diff
  // and leave Reconcile enabled. Rounded to cents before comparing to the
  // current balance so float noise from convertAmount's chained
  // division/multiplication (real for any wallet with cross-currency
  // activity) can't produce a nonzero-looking diff for what's actually a
  // no-op match - the server rounds the same way before deciding whether
  // there's anything to adjust.
  const trimmedTarget = targetBalance.trim();
  const parsedTarget = trimmedTarget === "" ? NaN : Number(trimmedTarget);
  const isValidTarget = Number.isFinite(parsedTarget);
  const diff = isValidTarget
    ? Math.round((parsedTarget - currentBalance) * 100) / 100
    : 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("targetBalance", targetBalance);
    formData.set("currentBalance", String(currentBalance));
    formData.set("note", note);

    startTransition(async () => {
      const result = await reconcileWallet(wallet.id, formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`${wallet.name} reconciled`);
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reconcile {wallet.name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Gauge currently shows {symbol}
          {currentBalance.toFixed(2)}. Type what your real account actually
          shows and we&apos;ll log the difference as a single adjustment.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="target-balance">Real balance</Label>
          <Input
            id="target-balance"
            type="number"
            step="0.01"
            value={targetBalance}
            onChange={(e) => setTargetBalance(e.target.value)}
            required
            autoFocus
          />
          {isValidTarget && diff !== 0 && (
            <p
              className={
                diff > 0
                  ? "text-xs text-emerald-600 dark:text-emerald-400"
                  : "text-destructive text-xs"
              }
            >
              {diff > 0 ? "+" : ""}
              {symbol}
              {diff.toFixed(2)} adjustment
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reconcile-note">Note (optional)</Label>
          <Input
            id="reconcile-note"
            placeholder="e.g. bank fee, forgot to log something"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending || diff === 0}>
            {isPending ? "Saving..." : "Reconcile"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
