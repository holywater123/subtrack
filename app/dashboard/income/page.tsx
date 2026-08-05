import { createClient } from "@/lib/supabase/server";
import { IncomeClient } from "@/components/dashboard/income-client";
import type { Income, Wallet } from "@/lib/types";

export default async function IncomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: income }, { data: wallets }, { data: settings }] =
    await Promise.all([
      supabase
        .from("income")
        .select("*")
        .order("received_on", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("wallets").select("*").order("created_at", { ascending: true }),
      supabase
        .from("user_settings")
        .select("default_currency")
        .eq("user_id", user!.id)
        .maybeSingle(),
    ]);

  return (
    <IncomeClient
      income={(income ?? []) as Income[]}
      wallets={(wallets ?? []) as Wallet[]}
      defaultCurrency={settings?.default_currency ?? "MYR"}
    />
  );
}
