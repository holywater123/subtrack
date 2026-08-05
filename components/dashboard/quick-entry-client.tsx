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

const TYPE_ITEMS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
];

interface Draft {
  type: "expense" | "income";
  amount: string;
  currency: string;
  category: string;
  date: string;
  note: string;
}

// Same shape as scanReceipt's contract: the AI only ever produces an
// editable draft, never inserts directly - Confirm & save reuses the exact
// addExpense/addIncome actions the regular dialogs use, so nothing about
// validation or the resulting row differs from a manual entry.
export function QuickEntryClient({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isParsing, startParsing] = useTransition();
  const [isSaving, startSaving] = useTransition();

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
      setDraft({
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
    const formData = new FormData();
    formData.set("amount", draft.amount);
    formData.set("currency", draft.currency);
    formData.set("category", draft.category);
    formData.set("note", draft.note);
    formData.set("walletId", "none");
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
  }

  const categoryItems = draft?.type === "income" ? INCOME_CATEGORIES : CATEGORIES;

  return (
    <MagicCard className="flex flex-col gap-4 rounded-2xl p-4">
      <div>
        <h2 className="font-medium">Quick entry</h2>
        <p className="text-muted-foreground text-xs">
          Type it like you&apos;d say it - &quot;Spent 15 on coffee&quot;,
          &quot;got paid 3000 salary&quot;.
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
      ) : (
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
      )}
    </MagicCard>
  );
}
