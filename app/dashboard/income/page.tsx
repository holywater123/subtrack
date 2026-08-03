import { createClient } from "@/lib/supabase/server";
import { IncomeClient } from "@/components/dashboard/income-client";
import type { Income, Wallet } from "@/lib/types";

export default async function IncomePage() {
  const supabase = await createClient();

  const [{ data: income }, { data: wallets }] = await Promise.all([
    supabase
      .from("income")
      .select("*")
      .order("received_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("wallets").select("*").order("created_at", { ascending: true }),
  ]);

  return (
    <IncomeClient
      income={(income ?? []) as Income[]}
      wallets={(wallets ?? []) as Wallet[]}
    />
  );
}
