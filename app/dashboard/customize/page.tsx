import { createClient } from "@/lib/supabase/server";
import { normalizeOverviewLayout } from "@/lib/overview-layout";
import { CustomizeClient } from "@/components/dashboard/customize-client";

export default async function CustomizePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from("user_settings")
    .select("overview_layout")
    .eq("user_id", user!.id)
    .maybeSingle();

  const layout = normalizeOverviewLayout(settings?.overview_layout);

  return <CustomizeClient initialLayout={layout} />;
}
