import { redirect } from "next/navigation";
import Link from "next/link";
import { CircleUserRound, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NavTabs } from "@/components/dashboard/nav-tabs";
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { DashboardParticles } from "@/components/dashboard/dashboard-particles";
import { AdvisorWidget } from "@/components/dashboard/advisor-widget";
import { QuickEntryWidget } from "@/components/dashboard/quick-entry-widget";
import type { ChatMessage, Wallet } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: settings }, { data: chatMessages }, { data: wallets }] =
    await Promise.all([
      supabase
        .from("user_settings")
        .select("full_name, onboarding_completed_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase.from("chat_messages").select("*").order("created_at", { ascending: true }),
      // Quick-entry widget needs the full wallet list - to default new
      // expense/income entries to the right wallet, and to resolve wallet
      // names for transfer / set-cash-pool / set-primary-spending intents.
      supabase.from("wallets").select("*").order("created_at"),
    ]);

  if (!settings?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <DashboardParticles />
      <header className="flex items-center justify-between gap-4">
        <DashboardGreeting name={settings?.full_name ?? ""} />
        <div className="flex items-center gap-1">
          <AnimatedThemeToggler />
          <Link href="/dashboard/achievements">
            <Button variant="ghost" size="icon" aria-label="Achievements">
              <Trophy className="size-4" />
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon" aria-label="Profile">
              <CircleUserRound className="size-4" />
            </Button>
          </Link>
        </div>
      </header>

      <NavTabs />

      {children}

      <AdvisorWidget messages={(chatMessages ?? []) as ChatMessage[]} />
      <QuickEntryWidget wallets={(wallets ?? []) as Wallet[]} />
    </div>
  );
}
