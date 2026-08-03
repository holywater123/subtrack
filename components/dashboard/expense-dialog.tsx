"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Paperclip } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { Expense } from "@/lib/types";
import { CURRENCIES } from "@/lib/currencies";
import { CATEGORIES, getCategory } from "@/lib/categories";
import {
  addExpense,
  updateExpense,
  scanReceipt,
  getReceiptUrl,
} from "@/app/dashboard/expenses/actions";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseDialog({
  open,
  expense,
  onOpenChange,
}: {
  open: boolean;
  expense?: Expense;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <ExpenseForm
            key={expense?.id ?? "new"}
            expense={expense}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExpenseForm({
  expense,
  onDone,
}: {
  expense?: Expense;
  onDone: () => void;
}) {
  const isEditing = Boolean(expense);
  const [amount, setAmount] = useState(
    expense ? String(expense.amount) : ""
  );
  const [currency, setCurrency] = useState(expense?.currency ?? "MYR");
  const [category, setCategory] = useState(
    getCategory(expense?.category ?? "other").value
  );
  const [spentOn, setSpentOn] = useState(expense?.spent_on ?? today());
  const [note, setNote] = useState(expense?.note ?? "");
  const [receiptPath, setReceiptPath] = useState(expense?.receipt_path ?? "");
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [hint, setHint] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isScanning, startScanning] = useTransition();
  const [isViewingReceipt, startViewingReceipt] = useTransition();

  function handleScan() {
    if (!scanFile) {
      toast.error("Choose an image first.");
      return;
    }
    const formData = new FormData();
    formData.set("file", scanFile);
    formData.set("hint", hint);

    startScanning(async () => {
      const result = await scanReceipt(formData);

      if ("receiptPath" in result && result.receiptPath) {
        setReceiptPath(result.receiptPath);
      }

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (result.amount !== undefined) setAmount(String(result.amount));
      if (result.currency) setCurrency(result.currency);
      if (result.category) setCategory(result.category);
      if (result.spentOn) setSpentOn(result.spentOn);
      if (result.note) setNote(result.note);
      toast.success("Receipt scanned - review the details below");
    });
  }

  function handleViewReceipt() {
    if (!receiptPath) return;
    const win = window.open("", "_blank");
    startViewingReceipt(async () => {
      const result = await getReceiptUrl(receiptPath);
      if ("error" in result) {
        toast.error(result.error);
        win?.close();
        return;
      }
      if (win) win.location.href = result.url;
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("amount", amount);
    formData.set("currency", currency);
    formData.set("category", category);
    formData.set("spentOn", spentOn);
    formData.set("note", note);
    formData.set("receiptPath", receiptPath);

    startTransition(async () => {
      const result = expense
        ? await updateExpense(expense.id, formData)
        : await addExpense(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(isEditing ? "Expense updated" : "Expense added");
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit expense" : "Add expense"}</DialogTitle>
      </DialogHeader>

      <div className="border-border flex flex-col gap-2 rounded-lg border border-dashed p-3">
        <Label htmlFor="receiptFile">Scan a receipt (optional)</Label>
        <Input
          id="receiptFile"
          type="file"
          accept="image/*"
          onChange={(e) => setScanFile(e.target.files?.[0] ?? null)}
        />
        <Input
          placeholder={'Hint for AI, e.g. "Grab receipt" (optional)'}
          value={hint}
          onChange={(e) => setHint(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleScan}
            disabled={isScanning || !scanFile}
          >
            {isScanning ? "Scanning..." : "Scan receipt"}
          </Button>
          {receiptPath && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={handleViewReceipt}
              disabled={isViewingReceipt}
            >
              <Paperclip className="size-3.5" />
              View receipt
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Currency</Label>
            <Select
              value={currency}
              onValueChange={(v) => v && setCurrency(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => v && setCategory(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="spentOn">Date</Label>
            <Input
              id="spentOn"
              type="date"
              value={spentOn}
              onChange={(e) => setSpentOn(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Lunch with friends, petrol top-up..."
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Add expense"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
