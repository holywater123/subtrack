import { createClient } from "@/lib/supabase/server";
import { cleanupExpiredReceipts } from "@/lib/receipt-cleanup";
import { ExpensesClient } from "@/components/dashboard/expenses-client";
import type { Expense } from "@/lib/types";

export default async function ExpensesPage() {
  const supabase = await createClient();

  await cleanupExpiredReceipts();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });

  return <ExpensesClient expenses={(expenses ?? []) as Expense[]} />;
}
