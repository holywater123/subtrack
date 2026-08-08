"use client";

import { useMemo, useState } from "react";
import { Plus, Wallet as WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ExpenseRow } from "@/components/dashboard/expense-row";
import { ExpenseDialog } from "@/components/dashboard/expense-dialog";
import { PeriodNav } from "@/components/ui/period-picker";
import {
  ExpensesBreakdown,
  type BreakdownExpense,
} from "@/components/dashboard/expenses-breakdown";
import { CATEGORIES } from "@/lib/categories";
import { PERIODS_WITH_YEAR, isInPeriodRange, type Period } from "@/lib/period";
import type { Expense, Wallet } from "@/lib/types";

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const PERIOD_ITEMS: { value: Period | "all"; label: string }[] = [
  { value: "all", label: "All time" },
  ...PERIODS_WITH_YEAR,
];

const CATEGORY_ITEMS = [
  { value: "all", label: "All categories" },
  ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

const SORT_ITEMS: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
  { value: "amount-desc", label: "Highest amount" },
  { value: "amount-asc", label: "Lowest amount" },
];

// Sentinel for expenses with no wallet_id - a real selectable option in the
// filter, not just excluded, since "which wallet did this come out of" is
// exactly as meaningful a question for unassigned entries as assigned ones.
const UNASSIGNED_WALLET = "unassigned";

export function ExpensesClient({
  expenses,
  breakdownExpenses,
  baseCurrency,
  wallets,
  defaultCurrency,
}: {
  expenses: Expense[];
  breakdownExpenses: BreakdownExpense[];
  baseCurrency: string;
  wallets: Wallet[];
  defaultCurrency: string;
}) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    expense?: Expense;
  }>({ open: false });
  const [period, setPeriod] = useState<Period | "all">("all");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("date-desc");
  // Empty = no wallet filter applied (show every wallet). Non-empty = only
  // expenses whose wallet_id (or the UNASSIGNED_WALLET sentinel, for
  // wallet_id === null) is in this set.
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>([]);

  const walletFilterLabel =
    selectedWalletIds.length === 0
      ? "All wallets"
      : selectedWalletIds.length === 1
        ? (wallets.find((w) => w.id === selectedWalletIds[0])?.name ??
          (selectedWalletIds[0] === UNASSIGNED_WALLET ? "Unassigned" : "1 wallet"))
        : `${selectedWalletIds.length} wallets`;

  function toggleWallet(id: string, checked: boolean) {
    setSelectedWalletIds((prev) =>
      checked ? [...prev, id] : prev.filter((w) => w !== id)
    );
  }

  const visibleExpenses = useMemo(() => {
    const filtered = expenses.filter((e) => {
      if (period !== "all" && !isInPeriodRange(e.spent_on, period, referenceDate)) {
        return false;
      }
      if (category !== "all" && e.category !== category) return false;
      if (
        selectedWalletIds.length > 0 &&
        !selectedWalletIds.includes(e.wallet_id ?? UNASSIGNED_WALLET)
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return a.spent_on.localeCompare(b.spent_on);
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return b.spent_on.localeCompare(a.spent_on);
      }
    });

    return sorted;
  }, [expenses, period, referenceDate, category, sort, selectedWalletIds]);

  return (
    <div className="flex flex-col gap-6">
      <ExpensesBreakdown expenses={breakdownExpenses} baseCurrency={baseCurrency} />

      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-medium">
          Recent expenses
        </h2>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setDialogState({ open: true })}
        >
          <Plus className="size-4" />
          Add expense
        </Button>
      </div>

      {expenses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Select
            items={PERIOD_ITEMS}
            value={period}
            onValueChange={(v) => {
              if (!v) return;
              setPeriod(v as Period | "all");
              setReferenceDate(new Date());
            }}
          >
            <SelectTrigger className="w-auto min-w-32 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_ITEMS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {period !== "all" && (
            <PeriodNav
              period={period}
              referenceDate={referenceDate}
              onReferenceDateChange={setReferenceDate}
            />
          )}
          {wallets.length > 0 && (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-auto min-w-32 flex-1 justify-start gap-1.5 font-normal"
                  />
                }
              >
                <WalletIcon className="size-4" />
                {walletFilterLabel}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-2">
                <p className="text-muted-foreground px-1.5 pb-1.5 text-xs font-medium">
                  Filter by wallet
                </p>
                <div className="flex flex-col gap-0.5">
                  {wallets.map((w) => (
                    <label
                      key={w.id}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="accent-primary focus-visible:ring-3 focus-visible:ring-ring/50 size-4 rounded-xs outline-none"
                        checked={selectedWalletIds.includes(w.id)}
                        onChange={(e) => toggleWallet(w.id, e.target.checked)}
                      />
                      {w.name}
                    </label>
                  ))}
                  <label className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm">
                    <input
                      type="checkbox"
                      className="accent-primary size-4"
                      checked={selectedWalletIds.includes(UNASSIGNED_WALLET)}
                      onChange={(e) => toggleWallet(UNASSIGNED_WALLET, e.target.checked)}
                    />
                    Unassigned
                  </label>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Select
            items={CATEGORY_ITEMS}
            value={category}
            onValueChange={(v) => v && setCategory(v)}
          >
            <SelectTrigger className="w-auto min-w-32 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ITEMS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={SORT_ITEMS}
            value={sort}
            onValueChange={(v) => v && setSort(v as SortOption)}
          >
            <SelectTrigger className="w-auto min-w-32 flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_ITEMS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {expenses.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No expenses logged yet. Add your first one - lunch, petrol,
          groceries, anything.
        </div>
      ) : visibleExpenses.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No expenses match this filter.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleExpenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              wallets={wallets}
              onEdit={() => setDialogState({ open: true, expense })}
            />
          ))}
        </div>
      )}

      <ExpenseDialog
        open={dialogState.open}
        expense={dialogState.expense}
        wallets={wallets}
        defaultCurrency={defaultCurrency}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
      />
    </div>
  );
}
