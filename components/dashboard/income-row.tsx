"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import type { Income, Wallet } from "@/lib/types";
import { currencySymbol } from "@/lib/currencies";
import { getIncomeCategory } from "@/lib/income-categories";
import { deleteIncome } from "@/app/dashboard/income/actions";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function IncomeRow({
  income,
  wallets,
  onEdit,
}: {
  income: Income;
  wallets: Wallet[];
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const category = getIncomeCategory(income.category);
  const Icon = category.icon;
  const symbol = currencySymbol(income.currency);
  const wallet = wallets.find((w) => w.id === income.wallet_id);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteIncome(income.id);
      if ("error" in result) toast.error(result.error);
      else toast.success("Income removed");
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
              +{symbol}
              {income.amount.toFixed(2)}
            </p>
            <span className="text-muted-foreground text-xs">
              {category.label}
            </span>
            {wallet && (
              <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px]">
                {wallet.name}
              </span>
            )}
          </div>
          <p className="text-muted-foreground truncate text-sm">
            {formatDate(income.received_on)}
            {income.note ? ` - ${income.note}` : ""}
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
