"use client";

import { useState } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TotalSpendCard } from "@/components/dashboard/total-spend-card";
import { WalletCard } from "@/components/dashboard/wallet-card";
import { WalletDialog } from "@/components/dashboard/wallet-dialog";
import { WalletTransferDialog } from "@/components/dashboard/wallet-transfer-dialog";
import { WalletTransferRow } from "@/components/dashboard/wallet-transfer-row";
import { BalanceTransferRow } from "@/components/dashboard/balance-transfer-row";
import {
  WalletsBreakdown,
  type WalletTypeBreakdownRow,
} from "@/components/dashboard/wallets-breakdown";
import {
  CreditSummaryCard,
  type CreditSummaryRow,
} from "@/components/dashboard/credit-summary-card";
import type { BalanceTransfer, Wallet, WalletTransfer } from "@/lib/types";

export function WalletsClient({
  walletRows,
  transfers,
  balanceTransfers,
  sourceWallets,
  unassignedTotal,
  totalCashOnHand,
  typeBreakdown,
  creditSummary,
  baseCurrency,
  defaultCurrency,
}: {
  walletRows: { wallet: Wallet; balance: number }[];
  transfers: WalletTransfer[];
  balanceTransfers: BalanceTransfer[];
  // Non-credit wallets only - a balance-transfer installment can't be paid
  // "from" a credit/pay-later wallet. Computed once by the page (see
  // app/dashboard/wallets/page.tsx), same pattern as debts/page.tsx's
  // sourceWallets, rather than re-filtered per BalanceTransferRow.
  sourceWallets: Wallet[];
  unassignedTotal: number;
  totalCashOnHand: number;
  typeBreakdown: WalletTypeBreakdownRow[];
  creditSummary: {
    totalCreditLimit: number;
    totalUsed: number;
    totalAvailable: number;
    rows: CreditSummaryRow[];
  };
  baseCurrency: string;
  defaultCurrency: string;
}) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    wallet?: Wallet;
  }>({ open: false });
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const wallets = walletRows.map((row) => row.wallet);
  const cashPoolRow = walletRows.find((row) => row.wallet.is_cash_pool);

  return (
    <div className="flex flex-col gap-6">
      {cashPoolRow ? (
        <TotalSpendCard
          label="Cash pool"
          totalMonthly={cashPoolRow.balance}
          subtitle={`Balance in ${cashPoolRow.wallet.name} - where new income and expenses land by default`}
          baseCurrency={cashPoolRow.wallet.currency}
        />
      ) : (
        <TotalSpendCard
          label="Unassigned"
          totalMonthly={unassignedTotal}
          subtitle="Income and expenses not assigned to any wallet - converted to the base currency. Star a wallet below to set it as your cash pool."
          baseCurrency={baseCurrency}
        />
      )}

      <WalletsBreakdown
        totalCashOnHand={totalCashOnHand}
        typeBreakdown={typeBreakdown}
        baseCurrency={baseCurrency}
      />

      {creditSummary.rows.length > 0 && (
        <CreditSummaryCard
          totalCreditLimit={creditSummary.totalCreditLimit}
          totalUsed={creditSummary.totalUsed}
          totalAvailable={creditSummary.totalAvailable}
          rows={creditSummary.rows}
          baseCurrency={baseCurrency}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-medium">
          Your wallets
        </h2>
        <div className="flex gap-2">
          {wallets.length >= 2 && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setTransferDialogOpen(true)}
            >
              <ArrowLeftRight className="size-4" />
              Transfer
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setDialogState({ open: true })}
          >
            <Plus className="size-4" />
            Add wallet
          </Button>
        </div>
      </div>

      {walletRows.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No wallets yet. Add a bank account, e-wallet, or cash to start
          separating where your money actually sits.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {walletRows.map((row) => (
            <WalletCard
              key={row.wallet.id}
              wallet={row.wallet}
              balance={row.balance}
              transfersRemaining={balanceTransfers
                .filter((t) => t.wallet_id === row.wallet.id)
                .reduce((sum, t) => sum + t.remaining_balance, 0)}
              onEdit={() => setDialogState({ open: true, wallet: row.wallet })}
            />
          ))}
        </div>
      )}

      <WalletDialog
        open={dialogState.open}
        wallet={dialogState.wallet}
        defaultCurrency={defaultCurrency}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
      />

      <WalletTransferDialog
        open={transferDialogOpen}
        wallets={wallets}
        onOpenChange={setTransferDialogOpen}
      />

      {balanceTransfers.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-sm font-medium">
            Balance transfers
          </h2>
          <div className="flex flex-col gap-3">
            {balanceTransfers.map((transfer) => (
              <BalanceTransferRow
                key={transfer.id}
                transfer={transfer}
                wallets={wallets}
                sourceWallets={sourceWallets}
              />
            ))}
          </div>
        </div>
      )}

      {transfers.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-muted-foreground text-sm font-medium">
            Recent transfers
          </h2>
          <div className="flex flex-col gap-3">
            {transfers.map((transfer) => (
              <WalletTransferRow
                key={transfer.id}
                transfer={transfer}
                wallets={wallets}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
