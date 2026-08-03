"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { WALLET_TYPE_VALUES } from "@/lib/wallet-types";

type ActionResult = { error: string } | { success: true };

function parseWalletForm(formData: FormData): ActionResult & {
  name?: string;
  walletType?: string;
  currency?: string;
  startingBalance?: number;
  description?: string | null;
} {
  const name = String(formData.get("name") ?? "").trim();
  const walletType = String(formData.get("walletType") ?? "cash");
  const currency = String(formData.get("currency") ?? "MYR");
  const startingBalance = Number(formData.get("startingBalance") || 0);
  const description = String(formData.get("description") ?? "").trim();

  if (!name) return { error: "Name is required." };
  if (!WALLET_TYPE_VALUES.includes(walletType)) {
    return { error: "Invalid wallet type." };
  }
  if (!CURRENCY_CODES.includes(currency)) {
    return { error: "Invalid currency." };
  }
  if (!Number.isFinite(startingBalance)) {
    return { error: "Enter a valid starting balance." };
  }

  return {
    success: true,
    name,
    walletType,
    currency,
    startingBalance,
    description: description || null,
  };
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/wallets");
  revalidatePath("/dashboard/income");
  revalidatePath("/dashboard/expenses");
}

export async function addWallet(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseWalletForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase.from("wallets").insert({
    user_id: user.id,
    name: parsed.name,
    wallet_type: parsed.walletType,
    currency: parsed.currency,
    starting_balance: parsed.startingBalance,
    description: parsed.description,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function updateWallet(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseWalletForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase
    .from("wallets")
    .update({
      name: parsed.name,
      wallet_type: parsed.walletType,
      currency: parsed.currency,
      starting_balance: parsed.startingBalance,
      description: parsed.description,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteWallet(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("wallets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}
