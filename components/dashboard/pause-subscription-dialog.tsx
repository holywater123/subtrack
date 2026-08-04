"use client";

import { useState, useTransition } from "react";
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
import type { Subscription } from "@/lib/types";
import { toggleSubscriptionPause } from "@/app/dashboard/actions";

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function PauseSubscriptionDialog({
  open,
  subscription,
  onOpenChange,
}: {
  open: boolean;
  subscription: Subscription;
  onOpenChange: (open: boolean) => void;
}) {
  const [until, setUntil] = useState(tomorrow());
  const [isPending, startTransition] = useTransition();

  function pauseUntilDate() {
    startTransition(async () => {
      const result = await toggleSubscriptionPause(subscription.id, {
        paused: true,
        until,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Paused ${subscription.name} until ${new Date(`${until}T00:00:00`).toLocaleDateString()}`
      );
      onOpenChange(false);
    });
  }

  function pausePermanently() {
    startTransition(async () => {
      const result = await toggleSubscriptionPause(subscription.id, {
        paused: true,
        permanent: true,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Paused ${subscription.name} indefinitely`);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pause {subscription.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pauseUntil">Resume on</Label>
          <Input
            id="pauseUntil"
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={pausePermanently}
            disabled={isPending}
          >
            Pause permanently
          </Button>
          <Button type="button" onClick={pauseUntilDate} disabled={isPending || !until}>
            Pause until date
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
