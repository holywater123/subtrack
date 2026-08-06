import { Lightbulb } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";

const TIPS = [
  "Forgot how to use it? You can always run a refresher.",
  "Wrong entry? You can always edit it - but be honest with yourself.",
];

// Static copy for now (the "run a refresher" tip references a feature that
// doesn't exist yet), always shown, not part of the configurable Overview
// layout - but only one line at a time, picked fresh on every server render
// (i.e. every page load/refresh), not the whole list at once.
export function TipsCard() {
  // eslint-disable-next-line react-hooks/purity -- intentionally non-deterministic: a fresh tip per server render (page load/refresh), not memoized
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];

  return (
    <MagicCard className="rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">Tips</p>
      <div className="mt-3 flex items-start gap-2.5 text-sm">
        <Lightbulb className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <span>{tip}</span>
      </div>
    </MagicCard>
  );
}
