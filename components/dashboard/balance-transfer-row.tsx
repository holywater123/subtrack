"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { PayInstallmentDialog } from "@/components/dashboard/pay-installment-dialog";
import type { BalanceTransfer, Wallet } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { deleteBalanceTransfer } from "@/app/dashboard/wallets/actions";

export function BalanceTransferRow({
  transfer,
  wallets,
}: {
  transfer: BalanceTransfer;
  wallets: Wallet[];
}) {
  const [isPending, startTransition] = useTransition();
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const wallet = wallets.find((w) => w.id === transfer.wallet_id);
  const symbol = currencySymbol(transfer.currency);
  const monthsLeft = Math.max(0, transfer.term_months - transfer.installments_paid);
  const monthlyInstallment =
    transfer.term_months > 0
      ? (transfer.original_amount + transfer.total_interest) / transfer.term_months
      : 0;
  const isPaidOff = transfer.remaining_balance <= 0;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBalanceTransfer(transfer.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Balance transfer removed");
    });
  }

  return (
    <MagicCard className="rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {transfer.name ?? "Balance transfer"} - {wallet?.name ?? "Unknown wallet"}
          </p>
          <p className="text-muted-foreground truncate text-sm">
            {isPaidOff
              ? "Paid off"
              : `${symbol}${transfer.remaining_balance.toFixed(2)} left - ${symbol}${monthlyInstallment.toFixed(2)}/mo - ${monthsLeft} month${monthsLeft === 1 ? "" : "s"} left`}
          </p>
        </div>
        {!isPaidOff && (
          <Button size="sm" variant="outline" onClick={() => setPayDialogOpen(true)}>
            Pay installment
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Delete"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <PayInstallmentDialog
        open={payDialogOpen}
        transfer={transfer}
        onOpenChange={setPayDialogOpen}
      />
    </MagicCard>
  );
}
