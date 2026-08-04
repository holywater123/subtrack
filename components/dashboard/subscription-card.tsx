"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pause, Pencil, Play, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PauseSubscriptionDialog } from "@/components/dashboard/pause-subscription-dialog";
import type { Subscription } from "@/lib/types";
import { monthlyEquivalent } from "@/lib/subscription-math";
import { currencySymbol } from "@/lib/currencies";
import { getCategory } from "@/lib/categories";
import { deleteSubscription, toggleSubscriptionPause } from "@/app/dashboard/actions";

function pausedLabel(subscription: Subscription) {
  if (subscription.paused_permanent) return "Paused";
  if (subscription.paused_until) {
    const date = new Date(`${subscription.paused_until}T00:00:00`);
    return `Paused until ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  }
  return "Paused";
}

const CYCLE_LABEL: Record<Subscription["billing_cycle"], string> = {
  monthly: "/mo",
  yearly: "/yr",
  weekly: "/wk",
};

export function SubscriptionCard({
  subscription,
  onEdit,
}: {
  subscription: Subscription;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const symbol = currencySymbol(subscription.currency);
  const category = getCategory(subscription.category);
  const CategoryIcon = category.icon;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSubscription(subscription.id);
      if ("error" in result) toast.error(result.error);
      else toast.success(`Removed ${subscription.name}`);
    });
  }

  function handlePauseButton() {
    if (subscription.is_paused) {
      startTransition(async () => {
        const result = await toggleSubscriptionPause(subscription.id, {
          paused: false,
        });
        if ("error" in result) toast.error(result.error);
        else toast.success(`Resumed ${subscription.name}`);
      });
    } else {
      setPauseDialogOpen(true);
    }
  }

  return (
    <MagicCard
      className={`rounded-xl p-4 ${subscription.is_paused ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${category.color}`}
        >
          <CategoryIcon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{subscription.name}</p>
            <Badge variant="outline" className="text-[10px]">
              {category.label}
            </Badge>
            {subscription.is_paused && (
              <Badge variant="outline" className="text-[10px]">
                {pausedLabel(subscription)}
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <span>
              {symbol}
              {subscription.price.toFixed(2)}
              {CYCLE_LABEL[subscription.billing_cycle]}
            </span>
            {subscription.billing_cycle !== "monthly" && (
              <Badge variant="secondary" className="text-[10px]">
                {symbol}
                {monthlyEquivalent(subscription).toFixed(2)}/mo
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePauseButton}
            disabled={isPending}
            aria-label={subscription.is_paused ? "Resume" : "Pause"}
          >
            {subscription.is_paused ? (
              <Play className="size-4" />
            ) : (
              <Pause className="size-4" />
            )}
          </Button>
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

      <PauseSubscriptionDialog
        open={pauseDialogOpen}
        subscription={subscription}
        onOpenChange={setPauseDialogOpen}
      />
    </MagicCard>
  );
}
