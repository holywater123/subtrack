import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getExchangeRates } from "@/lib/exchange-rates";
import { monthlyEquivalentInBase } from "@/lib/subscription-math";
import type { Subscription } from "@/lib/types";

const BASE_CURRENCY = "MYR";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  const subs = (subscriptions ?? []) as Subscription[];
  const rates = await getExchangeRates(BASE_CURRENCY);
  const totalMonthly = subs
    .filter((s) => !s.is_paused)
    .reduce((sum, s) => sum + monthlyEquivalentInBase(s, rates), 0);

  return (
    <DashboardClient
      subscriptions={subs}
      userEmail={user.email ?? ""}
      totalMonthly={totalMonthly}
      baseCurrency={BASE_CURRENCY}
    />
  );
}
