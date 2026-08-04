export type OverviewSectionId = "estimate" | "income" | "insight" | "budgets";

export interface OverviewSectionConfig {
  id: OverviewSectionId;
  visible: boolean;
}

export const OVERVIEW_SECTION_LABELS: Record<OverviewSectionId, string> = {
  estimate: "Spending estimate",
  income: "Income this month",
  insight: "AI insight",
  budgets: "Budgets",
};

export const DEFAULT_OVERVIEW_LAYOUT: OverviewSectionConfig[] = [
  { id: "estimate", visible: true },
  { id: "income", visible: true },
  { id: "insight", visible: true },
  { id: "budgets", visible: true },
];

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
