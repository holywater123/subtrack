"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_ITEMS } from "@/lib/currencies";
import { CATEGORIES } from "@/lib/categories";
import { INCOME_CATEGORIES } from "@/lib/income-categories";
import { parseQuickEntry } from "@/app/dashboard/quick-entry/actions";
import { addExpense } from "@/app/dashboard/expenses/actions";
import { addIncome } from "@/app/dashboard/income/actions";
import {
  addTransfer,
  setCashPoolWallet,
  setPrimarySpendingWallet,
} from "@/app/dashboard/wallets/actions";
import type { Wallet } from "@/lib/types";

const TYPE_ITEMS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

const TARGET_ITEMS = [
  { value: "cash_pool", label: "Cash pool" },
  { value: "primary_spending", label: "Primary spending" },
];

interface EntryDraft {
  kind: "entry";
  type: "expense" | "income";
  amount: string;
  currency: string;
  category: string;
  date: string;
  note: string;
}

interface TransferDraft {
  kind: "transfer";
  fromWalletId: string;
  toWalletId: string;
  amount: string;
  currency: string;
  date: string;
  note: string;
}

interface SetWalletDraft {
  kind: "set_wallet";
  target: "cash_pool" | "primary_spending";
  walletId: string;
}

type Draft = EntryDraft | TransferDraft | SetWalletDraft;

// Same "AI only ever produces an editable draft, never inserts directly"
// contract as scanReceipt: Confirm & save reuses the exact addExpense /
// addIncome / addTransfer / setCashPoolWallet / setPrimarySpendingWallet
// actions the regular UI uses, so nothing about validation or the
// resulting change differs from doing it manually.
export function QuickEntryClient({
  wallets,
  onDone,
}: {
  wallets: Wallet[];
  onDone: () => void;
}) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isParsing, startParsing] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const cashPoolWallet = wallets.find((w) => w.is_cash_pool);
  const primarySpendingWallet = wallets.find((w) => w.is_primary_spending);
  const walletItems = wallets.map((w) => ({
    value: w.id,
    label: w.is_primary_spending
      ? `${w.name} (Primary spending)`
      : w.is_cash_pool
        ? `${w.name} (Cash pool)`
        : w.name,
  }));

  function handleParse(e: FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const formData = new FormData();
    formData.set("text", trimmed);

    startParsing(async () => {
      const result = await parseQuickEntry(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (result.type === "transfer") {
        setDraft({
          kind: "transfer",
          fromWalletId: result.fromWalletId,
          toWalletId: result.toWalletId,
          amount: String(result.amount),
          currency: result.currency,
          date: result.date,
          note: result.note,
        });
        return;
      }

      if (result.type === "set_wallet") {
        setDraft({
          kind: "set_wallet",
          target: result.target,
          walletId: result.walletId,
        });
        return;
      }

      setDraft({
        kind: "entry",
        type: result.type,
        amount: String(result.amount),
        currency: result.currency,
        category: result.category,
        date: result.date,
        note: result.note,
      });
    });
  }

  function handleDiscard() {
    setDraft(null);
    setText("");
  }

  function handleConfirm() {
    if (!draft) return;

    if (draft.kind === "entry") {
      const formData = new FormData();
      formData.set("amount", draft.amount);
      formData.set("currency", draft.currency);
      formData.set("category", draft.category);
      formData.set("note", draft.note);
      // Primary spending wallet wins for expenses (it exists exactly to
      // answer "what did I pay with"); cash pool is the fallback for both,
      // matching the manual entry dialogs' default logic.
      const walletId =
        draft.type === "expense"
          ? (primarySpendingWallet?.id ?? cashPoolWallet?.id ?? "none")
          : (cashPoolWallet?.id ?? "none");
      formData.set("walletId", walletId);
      if (draft.type === "expense") {
        formData.set("spentOn", draft.date);
      } else {
        formData.set("receivedOn", draft.date);
      }

      startSaving(async () => {
        const result =
          draft.type === "expense"
            ? await addExpense(formData)
            : await addIncome(formData);

        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success(draft.type === "expense" ? "Expense added" : "Income added");
        setDraft(null);
        setText("");
        onDone();
      });
      return;
    }

    if (draft.kind === "transfer") {
      const formData = new FormData();
      formData.set("fromWalletId", draft.fromWalletId);
      formData.set("toWalletId", draft.toWalletId);
      formData.set("amount", draft.amount);
      formData.set("currency", draft.currency);
      formData.set("transferredOn", draft.date);
      formData.set("note", draft.note);

      startSaving(async () => {
        const result = await addTransfer(formData);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success("Transfer added");
        setDraft(null);
        setText("");
        onDone();
      });
      return;
    }

    // set_wallet
    startSaving(async () => {
      const result =
        draft.target === "cash_pool"
          ? await setCashPoolWallet(draft.walletId)
          : await setPrimarySpendingWallet(draft.walletId);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        draft.target === "cash_pool"
          ? "Cash pool wallet updated"
          : "Primary spending wallet updated"
      );
      setDraft(null);
      setText("");
      onDone();
    });
  }

  const categoryItems =
    draft?.kind === "entry" && draft.type === "income" ? INCOME_CATEGORIES : CATEGORIES;

  return (
    <MagicCard className="flex flex-col gap-4 rounded-2xl p-4">
      <div>
        <h2 className="font-medium">Quick entry</h2>
        <p className="text-muted-foreground text-xs">
          Type it like you&apos;d say it - &quot;Spent 15 on coffee&quot;,
          &quot;transfer 200 from Cash to Maybank&quot;, &quot;set Maybank as
          primary spending&quot;.
        </p>
      </div>

      {!draft ? (
        <form onSubmit={handleParse} className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Spent 15 on coffee..."
            disabled={isParsing}
            autoFocus
          />
          <Button type="submit" size="icon" disabled={isParsing || !text.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      ) : draft.kind === "entry" ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select
                items={TYPE_ITEMS}
                value={draft.type}
                onValueChange={(v) => {
                  if (!v) return;
                  const nextType = v as "expense" | "income";
                  const nextCategories =
                    nextType === "income" ? INCOME_CATEGORIES : CATEGORIES;
                  setDraft({
                    ...draft,
                    type: nextType,
                    category: nextCategories.some((c) => c.value === draft.category)
                      ? draft.category
                      : "other",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_ITEMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qe-amount">Amount</Label>
              <Input
                id="qe-amount"
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Select
                items={CURRENCY_ITEMS}
                value={draft.currency}
                onValueChange={(v) => v && setDraft({ ...draft, currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_ITEMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                items={categoryItems}
                value={draft.category}
                onValueChange={(v) => v && setDraft({ ...draft, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qe-date">Date</Label>
            <Input
              id="qe-date"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qe-note">Note</Label>
            <Input
              id="qe-note"
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              Discard
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={isSaving}>
              {isSaving ? "Saving..." : "Confirm & save"}
            </Button>
          </div>
        </div>
      ) : draft.kind === "transfer" ? (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>From</Label>
              <Select
                items={walletItems}
                value={draft.fromWalletId}
                onValueChange={(v) => v && setDraft({ ...draft, fromWalletId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {walletItems.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>To</Label>
              <Select
                items={walletItems}
                value={draft.toWalletId}
                onValueChange={(v) => v && setDraft({ ...draft, toWalletId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {walletItems.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qe-transfer-amount">Amount</Label>
              <Input
                id="qe-transfer-amount"
                type="number"
                min="0"
                step="0.01"
                value={draft.amount}
                onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Currency</Label>
              <Select
                items={CURRENCY_ITEMS}
                value={draft.currency}
                onValueChange={(v) => v && setDraft({ ...draft, currency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_ITEMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qe-transfer-date">Date</Label>
            <Input
              id="qe-transfer-date"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qe-transfer-note">Note</Label>
            <Input
              id="qe-transfer-note"
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            />
          </div>
          {draft.fromWalletId === draft.toWalletId && (
            <p className="text-destructive text-xs">
              Source and destination must be different wallets.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              Discard
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isSaving || draft.fromWalletId === draft.toWalletId}
            >
              {isSaving ? "Saving..." : "Confirm & save"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Set</Label>
            <Select
              items={TARGET_ITEMS}
              value={draft.target}
              onValueChange={(v) =>
                v && setDraft({ ...draft, target: v as SetWalletDraft["target"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_ITEMS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Wallet</Label>
            <Select
              items={walletItems}
              value={draft.walletId}
              onValueChange={(v) => v && setDraft({ ...draft, walletId: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {walletItems.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              Discard
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={isSaving}>
              {isSaving ? "Saving..." : "Confirm & save"}
            </Button>
          </div>
        </div>
      )}
    </MagicCard>
  );
}
