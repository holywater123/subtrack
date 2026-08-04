"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Award, type LucideIcon } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { NumberTicker } from "@/components/ui/number-ticker";
import { ConfettiBurst } from "@/components/ui/confetti";
import {
  ACHIEVEMENT_CATEGORIES,
  TIERED_ACHIEVEMENTS,
  ONE_OFF_ACHIEVEMENTS,
  TIER_LABELS,
  formatProgressValue,
  type AchievementTier,
} from "@/lib/achievement-catalog";
import type { AchievementView } from "@/lib/achievements";
import { currencySymbol } from "@/lib/currencies";
import { cn } from "@/lib/utils";

const TIER_ORDER: AchievementTier[] = ["bronze", "silver", "gold"];

const ICON_BY_ID: Record<string, LucideIcon> = Object.fromEntries(
  [...TIERED_ACHIEVEMENTS, ...ONE_OFF_ACHIEVEMENTS].map((def) => [def.id, def.icon])
);

const TIER_DOT_CLASS: Record<AchievementTier, string> = {
  bronze: "bg-amber-600",
  silver: "bg-slate-400",
  gold: "bg-yellow-500",
};

// Orb glow per tier reached, echoing the tier dot colors. One-off badges
// have no tier, so unlocked ones get the same warm "earned" glow as gold.
const TIER_GLOW: Record<AchievementTier, { from: string; to: string }> = {
  bronze: { from: "#d97706", to: "#f59e0b" },
  silver: { from: "#94a3b8", to: "#e2e8f0" },
  gold: { from: "#eab308", to: "#fde047" },
};
const DEFAULT_UNLOCKED_GLOW = TIER_GLOW.gold;

// One-off badges are stored with tier "unlocked" (see lib/achievements.ts),
// which isn't a real tier - skip those so this only ever returns an actual
// bronze/silver/gold reached by a tiered achievement.
function highestTier(achievement: AchievementView): AchievementTier | null {
  let best: AchievementTier | null = null;
  for (const t of achievement.unlockedTiers) {
    if (t.tier === "unlocked") continue;
    if (!best || TIER_ORDER.indexOf(t.tier) > TIER_ORDER.indexOf(best)) {
      best = t.tier;
    }
  }
  return best;
}

function AchievementTile({
  achievement,
  symbol,
}: {
  achievement: AchievementView;
  symbol: string;
}) {
  const Icon = ICON_BY_ID[achievement.id] ?? Award;
  const tier = highestTier(achievement);
  const unlockedAt = tier
    ? achievement.unlockedTiers.find((t) => t.tier === tier)?.unlockedAt
    : achievement.unlockedTiers[0]?.unlockedAt;
  const glow = tier ? TIER_GLOW[tier] : DEFAULT_UNLOCKED_GLOW;

  const content = (
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-full",
            achievement.unlocked
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-6" />
        </div>

        <div>
          <p className="text-sm font-medium">{achievement.title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {achievement.description}
          </p>
        </div>

        {achievement.tiered ? (
          <div className="mt-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              {TIER_ORDER.map((t) => {
                const reached = achievement.unlockedTiers.some((u) => u.tier === t);
                return (
                  <span
                    key={t}
                    title={TIER_LABELS[t]}
                    className={cn(
                      "size-2 rounded-full",
                      reached ? TIER_DOT_CLASS[t] : "bg-border"
                    )}
                  />
                );
              })}
            </div>
            {achievement.nextThreshold !== null ? (
              <p className="text-muted-foreground text-xs">
                {formatProgressValue(
                  Math.min(achievement.currentValue ?? 0, achievement.nextThreshold),
                  achievement.unit,
                  symbol
                )}{" "}
                / {formatProgressValue(achievement.nextThreshold, achievement.unit, symbol)}
              </p>
            ) : (
              <p className="text-xs font-medium text-yellow-600 dark:text-yellow-500">
                Max tier reached
              </p>
            )}
          </div>
        ) : (
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              achievement.unlocked
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {achievement.unlocked
              ? unlockedAt
                ? `Unlocked ${new Date(unlockedAt).toLocaleDateString()}`
                : "Unlocked"
              : "Locked"}
          </p>
        )}
      </div>
  );

  if (achievement.unlocked) {
    return (
      <MagicCard
        mode="orb"
        glowFrom={glow.from}
        glowTo={glow.to}
        glowSize={200}
        glowBlur={45}
        glowOpacity={0.55}
        className="rounded-xl p-4"
      >
        {content}
      </MagicCard>
    );
  }

  return <MagicCard className="rounded-xl p-4">{content}</MagicCard>;
}

export function AchievementsClient({
  achievements,
  newlyUnlockedKeys,
  baseCurrency,
}: {
  achievements: AchievementView[];
  newlyUnlockedKeys: string[];
  baseCurrency: string;
}) {
  const symbol = currencySymbol(baseCurrency);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || newlyUnlockedKeys.length === 0) return;
    firedRef.current = true;

    setConfettiTrigger((n) => n + 1);

    newlyUnlockedKeys.forEach((key, i) => {
      const [achievementId, tier] = key.split(":");
      const achievement = achievements.find((a) => a.id === achievementId);
      if (!achievement) return;
      const label =
        achievement.tiered && tier in TIER_LABELS
          ? `${achievement.title} — ${TIER_LABELS[tier as AchievementTier]}`
          : achievement.title;
      setTimeout(() => {
        toast.success(`Achievement unlocked: ${label}`);
      }, i * 250);
    });
    // Only ever fires once, right after the initial unlocked-keys prop lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <>
      <ConfettiBurst trigger={confettiTrigger} />

      <p className="text-muted-foreground -mt-2 text-sm">
        <NumberTicker value={unlockedCount} className="text-foreground font-medium" />{" "}
        / {achievements.length} unlocked
      </p>

      {ACHIEVEMENT_CATEGORIES.map((category) => {
        const rows = achievements.filter((a) => a.category === category);
        if (rows.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-muted-foreground mb-3 text-sm font-medium">
              {category}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rows.map((achievement) => (
                <AchievementTile
                  key={achievement.id}
                  achievement={achievement}
                  symbol={symbol}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
