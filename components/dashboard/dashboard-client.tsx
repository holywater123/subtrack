"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TotalSpendCard } from "@/components/dashboard/total-spend-card";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { SubscriptionDialog } from "@/components/dashboard/subscription-dialog";
import type { Subscription } from "@/lib/types";

export function DashboardClient({
  subscriptions,
  totalMonthly,
  baseCurrency,
}: {
  subscriptions: Subscription[];
  totalMonthly: number;
  baseCurrency: string;
}) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    subscription?: Subscription;
  }>({ open: false });

  const activeCount = subscriptions.filter((s) => !s.is_paused).length;

  return (
    <div className="flex flex-col gap-6">
      <TotalSpendCard
        totalMonthly={totalMonthly}
        subtitle={`Across ${activeCount} subscription${activeCount === 1 ? "" : "s"} - converted to ${baseCurrency}`}
        baseCurrency={baseCurrency}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-muted-foreground text-sm font-medium">
          Your subscriptions
        </h2>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setDialogState({ open: true })}
        >
          <Plus className="size-4" />
          Add subscription
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          No subscriptions yet. Add your first one - ChatGPT Plus, Google One,
          CapCut Pro, anything.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {subscriptions.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              onEdit={() => setDialogState({ open: true, subscription: sub })}
            />
          ))}
        </div>
      )}

      <SubscriptionDialog
        open={dialogState.open}
        subscription={dialogState.subscription}
        onOpenChange={(open) => setDialogState((s) => ({ ...s, open }))}
      />
    </div>
  );
}
