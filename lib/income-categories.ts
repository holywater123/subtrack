import {
  Briefcase,
  Gift,
  HandCoins,
  Laptop,
  RotateCcw,
  Store,
  Tag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export interface IncomeCategory {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const INCOME_CATEGORIES: IncomeCategory[] = [
  { value: "salary", label: "Salary", icon: Briefcase, color: "bg-emerald-500" },
  { value: "freelance", label: "Freelance", icon: Laptop, color: "bg-sky-500" },
  { value: "business", label: "Business", icon: Store, color: "bg-amber-500" },
  {
    value: "investment",
    label: "Investment",
    icon: TrendingUp,
    color: "bg-teal-500",
  },
  { value: "gift", label: "Gift", icon: Gift, color: "bg-pink-500" },
  { value: "refund", label: "Refund", icon: RotateCcw, color: "bg-cyan-500" },
  {
    value: "repayment",
    label: "Repayment",
    icon: HandCoins,
    color: "bg-orange-500",
  },
  { value: "other", label: "Other", icon: Tag, color: "bg-gray-500" },
];

export const INCOME_CATEGORY_VALUES: string[] = INCOME_CATEGORIES.map(
  (c) => c.value
);

const OTHER_INCOME_CATEGORY = INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1];

export function getIncomeCategory(value: string): IncomeCategory {
  return (
    INCOME_CATEGORIES.find((c) => c.value === value) ?? OTHER_INCOME_CATEGORY
  );
}
