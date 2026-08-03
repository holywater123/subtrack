"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pause, Pencil, Play, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Subscription } from "@/lib/types";
import { monthlyEquivalent } from "@/lib/subscription-math";
import { currencySymbol } from "@/lib/currencies";
import { deleteSubscription, toggleSubscriptionPause } from "@/app/dashboard/actions";

const CYCLE_LABEL: Record<Subscription["billing_cycle"], string> = {
  monthly: "/mo",
  yearly: "/yr",
  weekly: "/wk",
};

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-pink-500",
];

function avatarColor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function SubscriptionCard({
  subscription,
  onEdit,
}: {
  subscription: Subscription;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const symbol = currencySymbol(subscription.currency);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSubscription(subscription.id);
      if ("error" in result) toast.error(result.error);
      else toast.success(`Removed ${subscription.name}`);
    });
  }

  function handleTogglePause() {
    const nextPaused = !subscription.is_paused;
    startTransition(async () => {
      const result = await toggleSubscriptionPause(subscription.id, nextPaused);
      if ("error" in result) toast.error(result.error);
      else
        toast.success(
          nextPaused
            ? `Paused ${subscription.name}`
            : `Resumed ${subscription.name}`
        );
    });
  }

  return (
    <MagicCard
      className={`rounded-xl p-4 ${subscription.is_paused ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(subscription.name)}`}
        >
          {subscription.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{subscription.name}</p>
            {subscription.is_paused && (
              <Badge variant="outline" className="text-[10px]">
                Paused
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
            onClick={handleTogglePause}
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
    </MagicCard>
  );
}
