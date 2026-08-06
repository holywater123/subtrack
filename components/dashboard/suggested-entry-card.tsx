"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { ExpenseDialog } from "@/components/dashboard/expense-dialog";
import { getCategory } from "@/lib/categories";
import { currencySymbol } from "@/lib/currencies";
import type { SpendingSuggestion } from "@/lib/spending-patterns";
import type { Wallet } from "@/lib/types";

// A tappable popup, not a fixed preset - it only ever shows up when
// computeSpendingSuggestions() found a real recurring pattern in this
// user's own recent expenses. Tapping opens the normal expense dialog
// pre-filled, fully editable before anything saves - same "review before
// it lands" contract as the AI quick-entry widget and receipt scanning.
export function SuggestedEntryCard({
  suggestions,
  wallets,
  defaultCurrency,
}: {
  suggestions: SpendingSuggestion[];
  wallets: Wallet[];
  defaultCurrency?: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const suggestion = suggestions[0];

  if (!suggestion || dismissed) return null;

  const category = getCategory(suggestion.category);
  const symbol = currencySymbol(suggestion.currency);

  return (
    <>
      <MagicCard className="flex items-center gap-3 rounded-2xl p-4">
        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
          <Sparkles className="size-4" />
        </div>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => setDialogOpen(true)}
        >
          <p className="text-sm font-medium">
            Log {suggestion.note ? suggestion.note : category.label.toLowerCase()}{" "}
            again?
          </p>
          <p className="text-muted-foreground truncate text-xs">
            Logged {suggestion.occurrences} times recently - usually {symbol}
            {suggestion.amount.toFixed(2)}. Tap to fill it in.
          </p>
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss suggestion"
        >
          <X className="size-3.5" />
        </Button>
      </MagicCard>

      <ExpenseDialog
        open={dialogOpen}
        prefill={{
          amount: suggestion.amount,
          currency: suggestion.currency,
          category: suggestion.category,
          note: suggestion.note,
        }}
        wallets={wallets}
        defaultCurrency={defaultCurrency}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
