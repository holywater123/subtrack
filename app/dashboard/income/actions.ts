"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { INCOME_CATEGORY_VALUES } from "@/lib/income-categories";

type ActionResult = { error: string } | { success: true };

async function resolveWalletId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  walletIdRaw: string
): Promise<{ error: string } | { walletId: string | null }> {
  if (!walletIdRaw || walletIdRaw === "none") return { walletId: null };

  const { data } = await supabase
    .from("wallets")
    .select("id")
    .eq("id", walletIdRaw)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return { error: "Invalid wallet." };
  return { walletId: data.id };
}

function parseIncomeForm(formData: FormData): ActionResult & {
  amount?: number;
  currency?: string;
  category?: string;
  receivedOn?: string;
  note?: string | null;
  walletIdRaw?: string;
} {
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "MYR");
  const category = String(formData.get("category") ?? "other");
  const receivedOn = String(formData.get("receivedOn") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const walletIdRaw = String(formData.get("walletId") ?? "none");

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (!CURRENCY_CODES.includes(currency)) {
    return { error: "Invalid currency." };
  }
  if (!INCOME_CATEGORY_VALUES.includes(category)) {
    return { error: "Invalid category." };
  }
  if (!receivedOn || Number.isNaN(Date.parse(receivedOn))) {
    return { error: "Enter a valid date." };
  }

  return {
    success: true,
    amount,
    currency,
    category,
    receivedOn,
    note: note || null,
    walletIdRaw,
  };
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/income");
  revalidatePath("/dashboard/wallets");
}

export async function addIncome(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseIncomeForm(formData);
  if ("error" in parsed) return parsed;

  const walletResolved = await resolveWalletId(
    supabase,
    user.id,
    parsed.walletIdRaw!
  );
  if ("error" in walletResolved) return walletResolved;

  const { error } = await supabase.from("income").insert({
    user_id: user.id,
    amount: parsed.amount,
    currency: parsed.currency,
    category: parsed.category,
    received_on: parsed.receivedOn,
    note: parsed.note,
    wallet_id: walletResolved.walletId,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function updateIncome(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseIncomeForm(formData);
  if ("error" in parsed) return parsed;

  const walletResolved = await resolveWalletId(
    supabase,
    user.id,
    parsed.walletIdRaw!
  );
  if ("error" in walletResolved) return walletResolved;

  const { error } = await supabase
    .from("income")
    .update({
      amount: parsed.amount,
      currency: parsed.currency,
      category: parsed.category,
      received_on: parsed.receivedOn,
      note: parsed.note,
      wallet_id: walletResolved.walletId,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("income")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}
