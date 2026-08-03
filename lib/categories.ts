import {
  Briefcase,
  Clapperboard,
  Cloud,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Music2,
  Newspaper,
  Sparkles,
  Tag,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface Category {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const CATEGORIES: Category[] = [
  { value: "ai", label: "AI", icon: Sparkles, color: "bg-violet-500" },
  {
    value: "entertainment",
    label: "Entertainment",
    icon: Clapperboard,
    color: "bg-pink-500",
  },
  { value: "gaming", label: "Gaming", icon: Gamepad2, color: "bg-rose-500" },
  {
    value: "productivity",
    label: "Productivity",
    icon: Briefcase,
    color: "bg-sky-500",
  },
  { value: "utilities", label: "Utilities", icon: Wrench, color: "bg-slate-500" },
  {
    value: "cloud_storage",
    label: "Cloud & Storage",
    icon: Cloud,
    color: "bg-blue-500",
  },
  { value: "music", label: "Music", icon: Music2, color: "bg-emerald-500" },
  {
    value: "news_reading",
    label: "News & Reading",
    icon: Newspaper,
    color: "bg-amber-500",
  },
  {
    value: "health_fitness",
    label: "Health & Fitness",
    icon: HeartPulse,
    color: "bg-red-500",
  },
  {
    value: "education",
    label: "Education",
    icon: GraduationCap,
    color: "bg-indigo-500",
  },
  { value: "finance", label: "Finance", icon: Wallet, color: "bg-teal-500" },
  { value: "other", label: "Other", icon: Tag, color: "bg-gray-500" },
];

export const CATEGORY_VALUES: string[] = CATEGORIES.map((c) => c.value);

const OTHER_CATEGORY = CATEGORIES[CATEGORIES.length - 1];

export function getCategory(value: string): Category {
  return CATEGORIES.find((c) => c.value === value) ?? OTHER_CATEGORY;
}
