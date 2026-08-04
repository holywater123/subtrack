"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeOverviewLayout, type OverviewSectionConfig } from "@/lib/overview-layout";

type ActionResult = { error: string } | { success: true };

export async function saveOverviewLayout(
  layout: OverviewSectionConfig[]
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Re-run through the same sanitizer used for reads, so a tampered or
  // malformed payload can never persist an invalid layout.
  const cleaned = normalizeOverviewLayout(layout);

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    overview_layout: cleaned,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/customize");
  return { success: true };
}
