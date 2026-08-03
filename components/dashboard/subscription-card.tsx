"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Subscription } from "@/lib/types";
import { monthlyEquivalent } from "@/lib/subscription-math";
import { deleteSubscription } from "@/app/dashboard/actions";

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

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSubscription(subscription.id);
      if ("error" in result) toast.error(result.error);
      else toast.success(`Removed ${subscription.name}`);
    });
  }

  return (
    <MagicCard className="rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(subscription.name)}`}
        >
          {subscription.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{subscription.name}</p>
          <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <span>
              ${subscription.price.toFixed(2)}
              {CYCLE_LABEL[subscription.billing_cycle]}
            </span>
            {subscription.billing_cycle !== "monthly" && (
              <Badge variant="secondary" className="text-[10px]">
                ${monthlyEquivalent(subscription).toFixed(2)}/mo
              </Badge>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
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
