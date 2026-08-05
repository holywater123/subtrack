"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { currencyForCountry, TRACKING_FOCUS_OPTIONS, type TrackingFocus } from "@/lib/onboarding";
import { TRACKING_FOCUS_LAYOUTS } from "@/lib/overview-layout";

type ActionResult = { error: string };

const TRACKING_FOCUS_VALUES = TRACKING_FOCUS_OPTIONS.map((o) => o.value);

export async function completeOnboarding(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (!country) return { error: "Choose where you live." };

  const birthdateRaw = String(formData.get("birthdate") ?? "").trim();
  let birthdate: string | null = null;
  if (birthdateRaw) {
    if (Number.isNaN(Date.parse(birthdateRaw))) {
      return { error: "Enter a valid birthdate." };
    }
    birthdate = birthdateRaw;
  }

  const occupation = String(formData.get("occupation") ?? "").trim();
  const lifestyle = String(formData.get("lifestyle") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();

  const trackingFocusRaw = String(formData.get("trackingFocus") ?? "everything");
  const trackingFocus = (
    TRACKING_FOCUS_VALUES.includes(trackingFocusRaw as TrackingFocus)
      ? trackingFocusRaw
      : "everything"
  ) as TrackingFocus;

  const defaultCurrency = currencyForCountry(country);
  const layout = TRACKING_FOCUS_LAYOUTS[trackingFocus];

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    full_name: fullName || null,
    birthdate,
    goal: goal || null,
    occupation: occupation || null,
    lifestyle: lifestyle || null,
    country,
    default_currency: defaultCurrency,
    tracking_focus: trackingFocus,
    overview_layout: layout,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}
