"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import type { Wallet, WalletTransfer } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { deleteTransfer } from "@/app/dashboard/wallets/actions";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function WalletTransferRow({
  transfer,
  wallets,
}: {
  transfer: WalletTransfer;
  wallets: Wallet[];
}) {
  const [isPending, startTransition] = useTransition();
  const fromWallet = wallets.find((w) => w.id === transfer.from_wallet_id);
  const toWallet = wallets.find((w) => w.id === transfer.to_wallet_id);
  const symbol = currencySymbol(transfer.currency);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTransfer(transfer.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Transfer removed");
    });
  }

  return (
    <MagicCard className="rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="truncate font-medium">
              {fromWallet?.name ?? "Unknown"}
            </span>
            <ArrowRight className="text-muted-foreground size-3.5 shrink-0" />
            <span className="truncate font-medium">
              {toWallet?.name ?? "Unknown"}
            </span>
          </div>
          <p className="text-muted-foreground truncate text-sm">
            {symbol}
            {transfer.amount.toFixed(2)} - {formatDate(transfer.transferred_on)}
            {transfer.note ? ` - ${transfer.note}` : ""}
          </p>
        </div>
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
    </MagicCard>
  );
}
