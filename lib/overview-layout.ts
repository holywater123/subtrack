import type { TrackingFocus } from "@/lib/onboarding";

export type OverviewSectionId =
  | "safelimit"
  | "estimate"
  | "trend"
  | "income"
  | "insight"
  | "budgets";

export interface OverviewSectionConfig {
  id: OverviewSectionId;
  visible: boolean;
}

export const OVERVIEW_SECTION_LABELS: Record<OverviewSectionId, string> = {
  safelimit: "Daily safe limit",
  estimate: "Spending estimate",
  trend: "Spending trend",
  income: "Income this month",
  insight: "AI insight",
  budgets: "Budgets",
};

// safelimit leads - it's the hero metric, meant to be seen before anything
// else (see components/dashboard/daily-safe-limit-card.tsx).
export const DEFAULT_OVERVIEW_LAYOUT: OverviewSectionConfig[] = [
  { id: "safelimit", visible: true },
  { id: "estimate", visible: true },
  { id: "trend", visible: true },
  { id: "income", visible: true },
  { id: "insight", visible: true },
  { id: "budgets", visible: true },
];

// Applied exactly once, at onboarding completion, from the "what are you
// tracking?" answer - never re-applied later (a Settings edit to
// tracking_focus only updates that raw field; layout changes after
// onboarding go exclusively through the Customize page).
export const TRACKING_FOCUS_LAYOUTS: Record<TrackingFocus, OverviewSectionConfig[]> = {
  everything: DEFAULT_OVERVIEW_LAYOUT,
  subscriptions: [
    { id: "safelimit", visible: true },
    { id: "estimate", visible: true },
    { id: "budgets", visible: true },
    { id: "trend", visible: true },
    { id: "insight", visible: true },
    { id: "income", visible: false },
  ],
  daily_spend: [
    { id: "safelimit", visible: true },
    { id: "estimate", visible: true },
    { id: "trend", visible: true },
    { id: "budgets", visible: true },
    { id: "insight", visible: true },
    { id: "income", visible: false },
  ],
  income: [
    { id: "income", visible: true },
    { id: "safelimit", visible: true },
    { id: "estimate", visible: true },
    { id: "trend", visible: true },
    { id: "budgets", visible: true },
    { id: "insight", visible: true },
  ],
};

const VALID_IDS = new Set<string>(Object.keys(OVERVIEW_SECTION_LABELS));

// Sanitizes whatever comes back from the DB: drops unknown/stale ids (e.g.
// a section that no longer exists), de-dupes, and appends any current
// section missing from an older saved layout (e.g. one added after the
// user last saved) as visible, at the end.
export function normalizeOverviewLayout(raw: unknown): OverviewSectionConfig[] {
  const seen = new Set<string>();
  const cleaned: OverviewSectionConfig[] = [];

  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (
        entry &&
        typeof entry === "object" &&
        "id" in entry &&
        typeof entry.id === "string" &&
        VALID_IDS.has(entry.id) &&
        !seen.has(entry.id)
      ) {
        seen.add(entry.id);
        cleaned.push({
          id: entry.id as OverviewSectionId,
          visible: "visible" in entry ? Boolean(entry.visible) : true,
        });
      }
    }
  }

  for (const section of DEFAULT_OVERVIEW_LAYOUT) {
    if (!seen.has(section.id)) {
      cleaned.push({ id: section.id, visible: true });
    }
  }

  return cleaned;
}
