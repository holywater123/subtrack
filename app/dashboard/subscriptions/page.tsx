import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getExchangeRates } from "@/lib/exchange-rates";
import { monthlyEquivalentInBase } from "@/lib/subscription-math";
import { syncSubscriptionBilling } from "@/lib/subscription-billing";
import type { Subscription } from "@/lib/types";

const BASE_CURRENCY = "MYR";

export default async function SubscriptionsPage() {
  // This page reads subscriptions directly rather than through
  // getFinanceSummary(), so it needs its own sync call to stay correct if
  // it's the first page a user visits in a session.
  await syncSubscriptionBilling();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subscriptions }, { data: settings }] = await Promise.all([
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    supabase
      .from("user_settings")
      .select("default_currency")
      .eq("user_id", user!.id)
      .maybeSingle(),
  ]);

  const subs = (subscriptions ?? []) as Subscription[];
  const rates = await getExchangeRates(BASE_CURRENCY);
  const totalMonthly = subs
    .filter((s) => !s.is_paused)
    .reduce((sum, s) => sum + monthlyEquivalentInBase(s, rates), 0);

  return (
    <DashboardClient
      subscriptions={subs}
      totalMonthly={totalMonthly}
      baseCurrency={BASE_CURRENCY}
      defaultCurrency={settings?.default_currency ?? "MYR"}
    />
  );
}
