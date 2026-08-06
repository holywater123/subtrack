"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Repeat, Star, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { BalanceTransferDialog } from "@/components/dashboard/balance-transfer-dialog";
import type { Wallet } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { getWalletType, isCreditWallet } from "@/lib/wallet-types";
import { cn } from "@/lib/utils";
import {
  deleteWallet,
  toggleCashPoolWallet,
} from "@/app/dashboard/wallets/actions";

export function WalletCard({
  wallet,
  balance,
  transfersRemaining = 0,
  onEdit,
}: {
  wallet: Wallet;
  balance: number;
  // Sum of this wallet's active balance-transfer plans' remaining_balance -
  // those also consume the credit limit, same as outstanding_balance (see
  // app/dashboard/wallets/page.tsx's creditRows "usedBase" math), so
  // "available" here must match, not just subtract outstanding.
  transfersRemaining?: number;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isTogglingPool, startTogglingPool] = useTransition();
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const walletType = getWalletType(wallet.wallet_type);
  const Icon = walletType.icon;
  const symbol = currencySymbol(wallet.currency);
  const isCredit = isCreditWallet(wallet.wallet_type);
  const outstanding = wallet.outstanding_balance ?? 0;
  const used = outstanding + transfersRemaining;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteWallet(wallet.id);
      if ("error" in result) toast.error(result.error);
      else toast.success(`Removed ${wallet.name}`);
    });
  }

  function handleToggleCashPool() {
    startTogglingPool(async () => {
      const result = await toggleCashPoolWallet(wallet.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        wallet.is_cash_pool
          ? "Cash pool unset"
          : `${wallet.name} set as cash pool`
      );
    });
  }

  return (
    <MagicCard className="flex aspect-square flex-col rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-1">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-white ${walletType.color}`}
        >
          <Icon className="size-4" />
        </div>
        {!isCredit && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 -mt-1 -mr-1"
            onClick={handleToggleCashPool}
            disabled={isTogglingPool}
            aria-label={
              wallet.is_cash_pool ? "Unset as cash pool" : "Set as cash pool"
            }
          >
            <Star
              className={cn(
                "size-3.5",
                wallet.is_cash_pool && "fill-primary text-primary"
              )}
            />
          </Button>
        )}
      </div>

      <div className="mt-2.5 min-h-0 flex-1">
        <p className="truncate text-sm font-medium">{wallet.name}</p>
        <p className="text-muted-foreground text-xs">{walletType.label}</p>
        {wallet.is_cash_pool && (
          <span className="bg-primary/10 text-primary mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px]">
            Cash pool
          </span>
        )}
        {isCredit ? (
          <>
            <p className="mt-2 truncate text-lg font-semibold">
              {symbol}
              {outstanding.toFixed(2)}
            </p>
            <p className="text-muted-foreground text-xs">
              {wallet.credit_limit
                ? `of ${symbol}${wallet.credit_limit.toFixed(2)} limit`
                : "outstanding"}
            </p>
            {wallet.credit_limit !== null && (
              <p className="text-muted-foreground truncate text-xs">
                {symbol}
                {Math.max(0, wallet.credit_limit - used).toFixed(2)} available
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 truncate text-lg font-semibold">
            {symbol}
            {balance.toFixed(2)}
          </p>
        )}
        {wallet.description && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
            {wallet.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-0.5">
        {isCredit && outstanding > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setTransferDialogOpen(true)}
            aria-label="Convert to balance transfer"
          >
            <Repeat className="size-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onEdit}
          aria-label="Edit"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Delete"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {isCredit && (
        <BalanceTransferDialog
          open={transferDialogOpen}
          wallet={wallet}
          onOpenChange={setTransferDialogOpen}
        />
      )}
    </MagicCard>
  );
}
