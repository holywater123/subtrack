"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { getWalletType } from "@/lib/wallet-types";
import { deleteWallet } from "@/app/dashboard/wallets/actions";

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
