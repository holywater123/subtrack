import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingClient } from "@/components/onboarding/onboarding-client";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: settings } = await supabase
    .from("user_settings")
    .select("onboarding_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  // Already set up - don't let a bookmark or the back button show this
  // again.
  if (settings?.onboarding_completed_at) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <OnboardingClient />
    </div>
  );
}
