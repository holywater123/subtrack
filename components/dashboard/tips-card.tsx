import { Lightbulb } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";

const TIPS = [
  "Forgot how to use it? You can always run a refresher.",
  "Wrong entry? You can always edit it - but be honest with yourself.",
];

// Static for now, always shown (not part of the configurable Overview
// layout) - the "run a refresher" tip references a feature that doesn't
// exist yet, so this is copy only until that's built.
export function TipsCard() {
  return (
    <MagicCard className="rounded-2xl p-6">
      <p className="text-muted-foreground text-sm">Tips</p>
      <ul className="mt-3 flex flex-col gap-3">
        {TIPS.map((tip) => (
          <li key={tip} className="flex items-start gap-2.5 text-sm">
            <Lightbulb className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </MagicCard>
  );
}
