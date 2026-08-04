import {
  ArrowRightLeft,
  Banknote,
  Bot,
  CalendarCheck,
  CalendarDays,
  Flame,
  Landmark,
  LayoutGrid,
  PartyPopper,
  PiggyBank,
  Receipt,
  Repeat,
  ScanLine,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type AchievementTier = "bronze" | "silver" | "gold";

export const TIER_LABELS: Record<AchievementTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

export interface TieredThreshold {
  tier: AchievementTier;
  threshold: number;
}

export type ProgressUnit = "currency" | "days" | "months";

export interface AchievementDef {
  id: string;
  category: string;
  icon: LucideIcon;
  title: string;
  description: string;
  tiers?: TieredThreshold[];
  unit?: ProgressUnit;
}

// Tiered milestone/streak badges - one row per tier reached in
// user_achievements once crossed, never revoked even if the metric later
// regresses.
export const TIERED_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "savings_milestone",
    category: "Savings",
    icon: PiggyBank,
    title: "Savings milestone",
    description: "Grow your all-time cumulative savings (income minus expenses).",
    unit: "currency",
    tiers: [
      { tier: "bronze", threshold: 500 },
      { tier: "silver", threshold: 2000 },
      { tier: "gold", threshold: 10000 },
    ],
  },
  {
    id: "income_milestone",
    category: "Income",
    icon: TrendingUp,
    title: "Income milestone",
    description: "Hit a new high for total income logged in a single month.",
    unit: "currency",
    tiers: [
      { tier: "bronze", threshold: 1000 },
      { tier: "silver", threshold: 3000 },
      { tier: "gold", threshold: 5000 },
    ],
  },
  {
    id: "saving_streak",
    category: "Consistency",
    icon: Flame,
    title: "Saving streak",
    description: "String together consecutive months where income beats expenses.",
    unit: "months",
    tiers: [
      { tier: "bronze", threshold: 2 },
      { tier: "silver", threshold: 3 },
      { tier: "gold", threshold: 6 },
    ],
  },
  {
    id: "logging_streak",
    category: "Consistency",
    icon: CalendarCheck,
    title: "Logging streak",
    description: "Log an expense or income entry on consecutive days.",
    unit: "days",
    tiers: [
      { tier: "bronze", threshold: 7 },
      { tier: "silver", threshold: 30 },
      { tier: "gold", threshold: 90 },
    ],
  },
  {
    id: "budget_discipline",
    category: "Budgeting",
    icon: ShieldCheck,
    title: "Budget discipline",
    description: "Stay under every budgeted category for consecutive months.",
    unit: "months",
    tiers: [
      { tier: "bronze", threshold: 1 },
      { tier: "silver", threshold: 3 },
      { tier: "gold", threshold: 6 },
    ],
  },
];

// One-and-done badges - unlock once, tier is always "unlocked".
export const ONE_OFF_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_expense",
    category: "Getting started",
    icon: Receipt,
    title: "First expense",
    description: "Log your first expense.",
  },
  {
    id: "first_income",
    category: "Getting started",
    icon: Banknote,
    title: "First income",
    description: "Log your first income entry.",
  },
  {
    id: "first_receipt_scan",
    category: "Getting started",
    icon: ScanLine,
    title: "Receipt scanner",
    description: "Scan a receipt and let AI fill in the details.",
  },
  {
    id: "first_budget",
    category: "Getting started",
    icon: Target,
    title: "Budget setter",
    description: "Set your first monthly budget.",
  },
  {
    id: "first_wallet",
    category: "Getting started",
    icon: Wallet,
    title: "Wallet tracker",
    description: "Add your first wallet.",
  },
  {
    id: "first_transfer",
    category: "Getting started",
    icon: ArrowRightLeft,
    title: "First transfer",
    description: "Move money between two wallets.",
  },
  {
    id: "first_subscription",
    category: "Getting started",
    icon: Repeat,
    title: "Subscription tracker",
    description: "Track your first recurring subscription.",
  },
  {
    id: "debt_tracker",
    category: "Getting started",
    icon: Landmark,
    title: "Debt tracker",
    description: "Track your first debt.",
  },
  {
    id: "debt_free",
    category: "Savings",
    icon: PartyPopper,
    title: "Debt-free",
    description: "Pay off every debt you've tracked.",
  },
  {
    id: "used_advisor",
    category: "Getting started",
    icon: Bot,
    title: "Asked the advisor",
    description: "Send a message to the AI finance advisor.",
  },
  {
    id: "category_explorer",
    category: "Getting started",
    icon: LayoutGrid,
    title: "Category explorer",
    description: "Log expenses across 5 different categories.",
  },
  {
    id: "one_month_member",
    category: "Getting started",
    icon: CalendarDays,
    title: "One month in",
    description: "Stick around for a month.",
  },
];

export const ACHIEVEMENT_CATEGORIES: string[] = [
  "Savings",
  "Income",
  "Consistency",
  "Budgeting",
  "Getting started",
];

export function formatProgressValue(value: number, unit: ProgressUnit | undefined, symbol: string) {
  if (unit === "currency") return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (unit === "days") return `${Math.floor(value)} day${value === 1 ? "" : "s"}`;
  if (unit === "months") return `${Math.floor(value)} month${value === 1 ? "" : "s"}`;
  return `${value}`;
}
