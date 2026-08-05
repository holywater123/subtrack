"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { TRACKING_FOCUS_OPTIONS, type TrackingFocus } from "@/lib/onboarding";

type ActionResult = { error: string } | { success: true };

const TRACKING_FOCUS_VALUES = TRACKING_FOCUS_OPTIONS.map((o) => o.value);

// Never touches overview_layout - that mapping only applies once, at
// onboarding completion (app/onboarding/actions.ts). A later tracking-focus
// edit here just updates the raw field; re-arranging widgets afterward
// happens exclusively through the Customize page.
export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const birthdateRaw = String(formData.get("birthdate") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();
  const occupation = String(formData.get("occupation") ?? "").trim();
  const lifestyle = String(formData.get("lifestyle") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const defaultCurrency = String(formData.get("defaultCurrency") ?? "").trim();
  const trackingFocusRaw = String(formData.get("trackingFocus") ?? "").trim();

  let birthdate: string | null = null;
  if (birthdateRaw) {
    if (Number.isNaN(Date.parse(birthdateRaw))) {
      return { error: "Enter a valid birthdate." };
    }
    birthdate = birthdateRaw;
  }

  if (defaultCurrency && !CURRENCY_CODES.includes(defaultCurrency)) {
    return { error: "Invalid currency." };
  }

  if (
    trackingFocusRaw &&
    !TRACKING_FOCUS_VALUES.includes(trackingFocusRaw as TrackingFocus)
  ) {
    return { error: "Invalid tracking focus." };
  }

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    full_name: fullName || null,
    birthdate,
    goal: goal || null,
    occupation: occupation || null,
    lifestyle: lifestyle || null,
    country: country || null,
    ...(defaultCurrency ? { default_currency: defaultCurrency } : {}),
    ...(trackingFocusRaw ? { tracking_focus: trackingFocusRaw } : {}),
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function submitFeedback(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Pick a rating from 1 to 5." };
  }

  const comment = String(formData.get("comment") ?? "").trim();

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    rating,
    comment: comment || null,
  });

  if (error) return { error: error.message };

  return { success: true };
}
