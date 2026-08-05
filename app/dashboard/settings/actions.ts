"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error: string } | { success: true };

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const birthdateRaw = String(formData.get("birthdate") ?? "").trim();
  const goal = String(formData.get("goal") ?? "").trim();

  let birthdate: string | null = null;
  if (birthdateRaw) {
    if (Number.isNaN(Date.parse(birthdateRaw))) {
      return { error: "Enter a valid birthdate." };
    }
    birthdate = birthdateRaw;
  }

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    full_name: fullName || null,
    birthdate,
    goal: goal || null,
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
