import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavTabs } from "@/components/dashboard/nav-tabs";
import { signOut } from "@/app/dashboard/actions";

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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Gauge</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={signOut}>
            <Button
              variant="ghost"
              size="icon"
              type="submit"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </Button>
          </form>
        </div>
      </header>

      <NavTabs />

      {children}
    </div>
  );
}
