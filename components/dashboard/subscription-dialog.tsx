"use client";

import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
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
import type { Subscription } from "@/lib/types";
import { CURRENCIES } from "@/lib/currencies";
import { CATEGORIES } from "@/lib/categories";
import { addSubscription, updateSubscription } from "@/app/dashboard/actions";

export function SubscriptionDialog({
  open,
  subscription,
  onOpenChange,
}: {
  open: boolean;
  subscription?: Subscription;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <SubscriptionForm
            // Remounts the form (resetting its state) whenever a different
            // subscription is opened, instead of syncing props via an effect.
            key={subscription?.id ?? "new"}
            subscription={subscription}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionForm({
  subscription,
  onDone,
}: {
  subscription?: Subscription;
  onDone: () => void;
}) {
  const isEditing = Boolean(subscription);
  const [name, setName] = useState(subscription?.name ?? "");
  const [price, setPrice] = useState(
    subscription ? String(subscription.price) : ""
  );
  const [currency, setCurrency] = useState(subscription?.currency ?? "USD");
  const [billingCycle, setBillingCycle] = useState<
    Subscription["billing_cycle"]
  >(subscription?.billing_cycle ?? "monthly");
  const [category, setCategory] = useState(subscription?.category ?? "other");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("name", name);
    formData.set("price", price);
    formData.set("currency", currency);
    formData.set("billingCycle", billingCycle);
    formData.set("category", category);

    startTransition(async () => {
      const result = subscription
        ? await updateSubscription(subscription.id, formData)
        : await addSubscription(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(isEditing ? "Subscription updated" : "Subscription added");
      onDone();
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Edit subscription" : "Add subscription"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ChatGPT Plus, Google One, CapCut Pro..."
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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
            <Label>Billing cycle</Label>
            <Select
              value={billingCycle}
              onValueChange={(v) =>
                v && setBillingCycle(v as Subscription["billing_cycle"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
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
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Add subscription"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
