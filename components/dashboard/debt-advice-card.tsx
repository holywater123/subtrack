import { Sparkles } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";

export function DebtAdviceCard({ advice }: { advice: string }) {
  return (
    <MagicCard className="rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="text-muted-foreground size-4" />
        <p className="text-muted-foreground text-sm">Payoff advice</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{advice}</p>
    </MagicCard>
  );
}
