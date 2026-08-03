import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/dashboard/settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("full_name, birthdate, goal")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <SettingsClient
      email={user!.email ?? ""}
      fullName={settings?.full_name ?? ""}
      birthdate={settings?.birthdate ?? ""}
      goal={settings?.goal ?? ""}
    />
  );
}
