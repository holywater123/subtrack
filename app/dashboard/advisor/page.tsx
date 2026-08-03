import { createClient } from "@/lib/supabase/server";
import { AdvisorClient } from "@/components/dashboard/advisor-client";
import type { ChatMessage } from "@/lib/types";

export default async function AdvisorPage() {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true });

  return <AdvisorClient messages={(messages ?? []) as ChatMessage[]} />;
}
