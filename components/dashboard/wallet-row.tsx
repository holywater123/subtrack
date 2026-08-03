"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Star, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { getWalletType } from "@/lib/wallet-types";
import { cn } from "@/lib/utils";
import {
  deleteWallet,
  toggleCashPoolWallet,
} from "@/app/dashboard/wallets/actions";

export function WalletRow({
  wallet,
  balance,
  onEdit,
}: {
  wallet: Wallet;
  balance: number;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isTogglingPool, startTogglingPool] = useTransition();
  const walletType = getWalletType(wallet.wallet_type);
  const Icon = walletType.icon;
  const symbol = currencySymbol(wallet.currency);

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
    <MagicCard className="rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${walletType.color}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{wallet.name}</p>
            <span className="text-muted-foreground text-xs">
              {walletType.label}
            </span>
            {wallet.is_cash_pool && (
              <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px]">
                Cash pool
              </span>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <span className="font-medium text-foreground">
              {symbol}
              {balance.toFixed(2)}
            </span>
            {wallet.description && (
              <span className="truncate text-xs">{wallet.description}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleCashPool}
            disabled={isTogglingPool}
            aria-label={
              wallet.is_cash_pool ? "Unset as cash pool" : "Set as cash pool"
            }
          >
            <Star
              className={cn(
                "size-4",
                wallet.is_cash_pool && "fill-primary text-primary"
              )}
            />
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
            <Pencil className="size-4" />
          </Button>
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
      </div>
    </MagicCard>
  );
}
