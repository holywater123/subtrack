"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/subscriptions", label: "Subscriptions" },
  { href: "/dashboard/expenses", label: "Expenses" },
  { href: "/dashboard/income", label: "Income" },
  { href: "/dashboard/wallets", label: "Wallets" },
  { href: "/dashboard/budgets", label: "Budgets" },
  { href: "/dashboard/debts", label: "Debts" },
  { href: "/dashboard/achievements", label: "Achievements" },
  { href: "/dashboard/advisor", label: "Advisor" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
