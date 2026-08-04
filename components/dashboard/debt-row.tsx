"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Banknote, Pencil, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PayDebtDialog } from "@/components/dashboard/pay-debt-dialog";
import type { DebtListItem } from "@/lib/debt-list";
import { getDebtListItemType } from "@/lib/debt-list";
import type { Wallet } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { deleteDebt } from "@/app/dashboard/debts/actions";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function dueDateBadge(dueDate: string | null) {
  if (!dueDate) return null;

  const due = new Date(`${dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil < 0) {
    return (
      <Badge variant="destructive" className="text-[10px]">
        Overdue
      </Badge>
    );
  }
  if (daysUntil <= 7) {
    return (
      <Badge
        variant="outline"
        className="border-amber-600/30 text-[10px] text-amber-600"
      >
        Due in {daysUntil} day{daysUntil === 1 ? "" : "s"}
      </Badge>
    );
  }
  return (
    <span className="text-muted-foreground text-xs">
      Due {formatDate(dueDate)}
    </span>
  );
}

export function DebtRow({
  item,
  sourceWallets,
  onEdit,
}: {
  item: DebtListItem;
  sourceWallets: Wallet[];
  onEdit?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const type = getDebtListItemType(item);
  const Icon = type.icon;
  const symbol = currencySymbol(item.currency);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDebt(item.id);
      if ("error" in result) toast.error(result.error);
      else toast.success(`Removed ${item.name}`);
    });
  }

  return (
    <MagicCard className="rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${type.color}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{item.name}</p>
            {dueDateBadge(item.dueDate)}
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <span>
              {symbol}
              {item.balance.toFixed(2)}
            </span>
            {item.creditLimit !== null && (
              <span className="text-xs">
                of {symbol}
                {item.creditLimit.toFixed(2)} limit
              </span>
            )}
            <span className="text-xs">{type.label}</span>
            {item.interestRate !== null && (
              <span className="text-xs">{item.interestRate}% APR</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPayDialogOpen(true)}
            disabled={item.balance <= 0}
            aria-label="Pay"
          >
            <Banknote className="size-4" />
          </Button>
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
              <Pencil className="size-4" />
            </Button>
          )}
          {item.kind === "debt" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isPending}
              aria-label="Delete"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <PayDebtDialog
        open={payDialogOpen}
        item={item}
        sourceWallets={sourceWallets}
        onOpenChange={setPayDialogOpen}
      />
    </MagicCard>
  );
}
