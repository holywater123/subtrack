import { getAchievements } from "@/lib/achievements";
import { AchievementsClient } from "@/components/dashboard/achievements-client";
import { BASE_CURRENCY } from "@/lib/finance-summary";

export default async function AchievementsPage() {
  const { achievements, newlyUnlockedKeys } = await getAchievements();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Achievements</h2>
        <p className="text-muted-foreground text-sm">
          Badges for building good money habits - keep logging, keep saving.
        </p>
      </div>

      <AchievementsClient
        achievements={achievements}
        newlyUnlockedKeys={newlyUnlockedKeys}
        baseCurrency={BASE_CURRENCY}
      />
    </div>
  );
}
