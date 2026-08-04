import {
  Banknote,
  HandCoins,
  Landmark,
  PiggyBank,
  Receipt,
  Repeat,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";

interface Feature {
  icon: LucideIcon;
  color: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Repeat,
    color: "bg-violet-500",
    title: "Subscriptions",
    description:
      "Track every recurring charge, in any currency, and see what it really costs you per month.",
  },
  {
    icon: Receipt,
    color: "bg-orange-500",
    title: "Expenses",
    description:
      "Log spending in seconds, or snap a receipt and let AI fill in the details.",
  },
  {
    icon: Banknote,
    color: "bg-emerald-500",
    title: "Income",
    description: "See what's actually coming in, not just what's going out.",
  },
  {
    icon: Landmark,
    color: "bg-blue-500",
    title: "Wallets",
    description:
      "Model your real accounts - bank, e-wallet, cash - and move money between them deliberately.",
  },
  {
    icon: PiggyBank,
    color: "bg-teal-500",
    title: "Budgets",
    description: "Set a monthly cap per category and watch it in real time.",
  },
  {
    icon: HandCoins,
    color: "bg-red-500",
    title: "Debts",
    description:
      "Track what you owe and get a clear plan for which to pay off first.",
  },
  {
    icon: Sparkles,
    color: "bg-sky-500",
    title: "AI Advisor",
    description:
      "Ask questions about your finances and get honest answers grounded in your real data - never a guess.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-5xl px-4 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Everything your money touches, in one dashboard
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          No more juggling five apps and a spreadsheet.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <MagicCard key={feature.title} className="rounded-2xl p-5">
            <div
              className={`flex size-10 items-center justify-center rounded-full text-white ${feature.color}`}
            >
              <feature.icon className="size-5" />
            </div>
            <h3 className="mt-3 font-medium">{feature.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {feature.description}
            </p>
          </MagicCard>
        ))}
      </div>
    </section>
  );
}
