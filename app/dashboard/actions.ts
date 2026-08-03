"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BillingCycle } from "@/lib/types";

const BILLING_CYCLES: BillingCycle[] = ["monthly", "yearly", "weekly"];

type ActionResult = { error: string } | { success: true };

function parseSubscriptionForm(formData: FormData): ActionResult & {
  name?: string;
  price?: number;
  billingCycle?: BillingCycle;
} {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const billingCycle = String(formData.get("billingCycle") ?? "monthly");

  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Enter a valid price." };
  }
  if (!BILLING_CYCLES.includes(billingCycle as BillingCycle)) {
    return { error: "Invalid billing cycle." };
  }

  return {
    success: true,
    name,
    price,
    billingCycle: billingCycle as BillingCycle,
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
    billing_cycle: parsed.billingCycle,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
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
      billing_cycle: parsed.billingCycle,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
