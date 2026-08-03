"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TotalSpendCard } from "@/components/dashboard/total-spend-card";
import { WalletRow } from "@/components/dashboard/wallet-row";
import { WalletDialog } from "@/components/dashboard/wallet-dialog";
import {
  WalletsBreakdown,
  type WalletTypeBreakdownRow,
} from "@/components/dashboard/wallets-breakdown";
import type { Wallet } from "@/lib/types";

export function WalletsClient({
  walletRows,
  unassignedTotal,
  totalCashOnHand,
  typeBreakdown,
  baseCurrency,
}: {
  walletRows: { wallet: Wallet; balance: number }[];
  unassignedTotal: number;
  totalCashOnHand: number;
  typeBreakdown: WalletTypeBreakdownRow[];
  baseCurrency: string;
}) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    wallet?: Wallet;
  }>({ open: false });

  return (
    <div className="flex flex-col gap-6">
      <TotalSpendCard
        label="Unassigned"
        totalMonthly={unassignedTotal}
        subtitle="Income and expenses not assigned to any wallet - converted to the base currency"
        baseCurrency={baseCurrency}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-medium">
          Your wallets
        </h2>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setDialogState({ open: true })}
        >
          <Plus className="size-4" />
          Add wallet
        </Button>
      </div>

      {walletRows.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No wallets yet. Add a bank account, e-wallet, or cash to start
          separating where your money actually sits.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {walletRows.map((row) => (
            <WalletRow
              key={row.wallet.id}
              wallet={row.wallet}
              balance={row.balance}
              onEdit={() => setDialogState({ open: true, wallet: row.wallet })}
            />
          ))}
        </div>
      )}

      <WalletDialog
        open={dialogState.open}
        wallet={dialogState.wallet}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
      />

      <WalletsBreakdown
        totalCashOnHand={totalCashOnHand}
        typeBreakdown={typeBreakdown}
        baseCurrency={baseCurrency}
      />
    </div>
  );
}
