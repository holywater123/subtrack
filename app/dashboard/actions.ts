"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { CATEGORY_VALUES } from "@/lib/categories";
import type { BillingCycle } from "@/lib/types";

const BILLING_CYCLES: BillingCycle[] = ["monthly", "yearly", "weekly"];

type ActionResult = { error: string } | { success: true };

function parseSubscriptionForm(formData: FormData): ActionResult & {
  name?: string;
  price?: number;
  currency?: string;
  billingCycle?: BillingCycle;
  category?: string;
  nextBillingDate?: string;
} {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const currency = String(formData.get("currency") ?? "USD");
  const billingCycle = String(formData.get("billingCycle") ?? "monthly");
  const category = String(formData.get("category") ?? "other");
  const nextBillingDate = String(formData.get("nextBillingDate") ?? "");

  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Enter a valid price." };
  }
  if (!CURRENCY_CODES.includes(currency)) {
    return { error: "Invalid currency." };
  }
  if (!BILLING_CYCLES.includes(billingCycle as BillingCycle)) {
    return { error: "Invalid billing cycle." };
  }
  if (!CATEGORY_VALUES.includes(category)) {
    return { error: "Invalid category." };
  }
  if (!nextBillingDate || Number.isNaN(Date.parse(nextBillingDate))) {
    return { error: "Enter a valid billing date." };
  }

  return {
    success: true,
    name,
    price,
    currency,
    billingCycle: billingCycle as BillingCycle,
    category,
    nextBillingDate,
  };
}

export async function addSubscription(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseSubscriptionForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase.from("subscriptions").insert({
    user_id: user.id,
    name: parsed.name,
    price: parsed.price,
    currency: parsed.currency,
    billing_cycle: parsed.billingCycle,
    category: parsed.category,
    next_billing_date: parsed.nextBillingDate,
    billing_day: Number(parsed.nextBillingDate!.slice(8, 10)),
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  return { success: true };
}

export async function updateSubscription(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseSubscriptionForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase
    .from("subscriptions")
    .update({
      name: parsed.name,
      price: parsed.price,
      currency: parsed.currency,
      billing_cycle: parsed.billingCycle,
      category: parsed.category,
      next_billing_date: parsed.nextBillingDate,
      billing_day: Number(parsed.nextBillingDate!.slice(8, 10)),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  return { success: true };
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleSubscriptionPause(
  id: string,
  options: { paused: boolean; until?: string | null; permanent?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const permanent = options.paused && Boolean(options.permanent);
  const until = options.paused && !permanent ? (options.until ?? null) : null;

  if (until && Number.isNaN(Date.parse(until))) {
    return { error: "Invalid resume date." };
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      is_paused: options.paused,
      paused_until: until,
      paused_permanent: permanent,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
