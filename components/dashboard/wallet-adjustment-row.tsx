"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import type { Wallet, WalletAdjustment } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { deleteAdjustment } from "@/app/dashboard/wallets/actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Kept visible (not folded silently into the balance) so a reconciliation
// is a logged, undoable event, not an invisible fudge factor - consistent
// with the rest of the app's "review before it lands, nothing silent"
// stance elsewhere (AI quick entry, receipt scanning).
export function WalletAdjustmentRow({
  adjustment,
  wallets,
}: {
  adjustment: WalletAdjustment;
  wallets: Wallet[];
}) {
  const [isPending, startTransition] = useTransition();
  const wallet = wallets.find((w) => w.id === adjustment.wallet_id);
  const symbol = currencySymbol(adjustment.currency);
  const isPositive = adjustment.amount > 0;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAdjustment(adjustment.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Adjustment removed");
    });
  }

  return (
    <MagicCard className="rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {wallet?.name ?? "Unknown wallet"}
          </p>
          <p className="text-muted-foreground truncate text-sm">
            <span
              className={
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }
            >
              {isPositive ? "+" : ""}
              {symbol}
              {adjustment.amount.toFixed(2)}
            </span>
            {" - "}
            {formatDate(adjustment.created_at)}
            {adjustment.note ? ` - ${adjustment.note}` : ""}
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
