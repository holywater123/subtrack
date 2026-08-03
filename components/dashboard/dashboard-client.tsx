"use client";

import { useMemo, useState } from "react";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TotalSpendCard } from "@/components/dashboard/total-spend-card";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { SubscriptionDialog } from "@/components/dashboard/subscription-dialog";
import { signOut } from "@/app/dashboard/actions";
import { monthlyEquivalent } from "@/lib/subscription-math";
import type { Subscription } from "@/lib/types";

export function DashboardClient({
  subscriptions,
  userEmail,
}: {
  subscriptions: Subscription[];
  userEmail: string;
}) {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    subscription?: Subscription;
  }>({ open: false });

  const totalMonthly = useMemo(
    () => subscriptions.reduce((sum, s) => sum + monthlyEquivalent(s), 0),
    [subscriptions]
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">SubTrack</h1>
          <p className="text-muted-foreground text-sm">{userEmail}</p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={signOut}>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </header>

      <TotalSpendCard totalMonthly={totalMonthly} count={subscriptions.length} />

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
