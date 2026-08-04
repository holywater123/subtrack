"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Landmark, Paperclip, Pencil, Repeat, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import type { Expense, Wallet } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { getCategory } from "@/lib/categories";
import { deleteExpense } from "@/app/dashboard/expenses/actions";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ExpenseRow({
  expense,
  wallets,
  onEdit,
}: {
  expense: Expense;
  wallets: Wallet[];
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const category = getCategory(expense.category);
  const Icon = category.icon;
  const symbol = currencySymbol(expense.currency);
  const wallet = wallets.find((w) => w.id === expense.wallet_id);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteExpense(expense.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Expense removed");
    });
  }

  return (
    <MagicCard className="rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${category.color}`}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-medium">
              {symbol}
              {expense.amount.toFixed(2)}
            </p>
            <span className="text-muted-foreground text-xs">
              {category.label}
            </span>
            {wallet && (
              <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                {wallet.name}
              </span>
            )}
            {expense.subscription_id && (
              <span className="bg-muted text-muted-foreground flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px]">
                <Repeat className="size-2.5" />
                Subscription
              </span>
            )}
            {expense.debt_id && (
              <span className="bg-muted text-muted-foreground flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px]">
                <Landmark className="size-2.5" />
                Interest
              </span>
            )}
            {expense.receipt_path && (
              <Paperclip className="text-muted-foreground size-3" />
            )}
          </div>
          <p className="text-muted-foreground truncate text-sm">
            {formatDate(expense.spent_on)}
            {expense.note ? ` - ${expense.note}` : ""}
          </p>
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
