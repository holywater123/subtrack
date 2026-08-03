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

export async function toggleCashPoolWallet(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: wallet } = await supabase
    .from("wallets")
    .select("is_cash_pool")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wallet) return { error: "Wallet not found." };

  // Only one wallet can be the cash pool at a time - clear any existing
  // one first so the partial unique index never sees two active rows.
  const { error: clearError } = await supabase
    .from("wallets")
    .update({ is_cash_pool: false })
    .eq("user_id", user.id);

  if (clearError) return { error: clearError.message };

  if (!wallet.is_cash_pool) {
    const { error } = await supabase
      .from("wallets")
      .update({ is_cash_pool: true })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return { error: error.message };
  }

  revalidateAll();
  return { success: true };
}

function parseTransferForm(formData: FormData): ActionResult & {
  fromWalletId?: string;
  toWalletId?: string;
  amount?: number;
  currency?: string;
  transferredOn?: string;
  note?: string | null;
} {
  const fromWalletId = String(formData.get("fromWalletId") ?? "");
  const toWalletId = String(formData.get("toWalletId") ?? "");
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "MYR");
  const transferredOn = String(formData.get("transferredOn") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!fromWalletId || !toWalletId) {
    return { error: "Choose both wallets." };
  }
  if (fromWalletId === toWalletId) {
    return { error: "Choose two different wallets." };
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (!CURRENCY_CODES.includes(currency)) {
    return { error: "Invalid currency." };
  }
  if (!transferredOn || Number.isNaN(Date.parse(transferredOn))) {
    return { error: "Enter a valid date." };
  }

  return {
    success: true,
    fromWalletId,
    toWalletId,
    amount,
    currency,
    transferredOn,
    note: note || null,
  };
}

export async function addTransfer(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseTransferForm(formData);
  if ("error" in parsed) return parsed;

  const { data: ownedWallets } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", user.id)
    .in("id", [parsed.fromWalletId!, parsed.toWalletId!]);

  if ((ownedWallets ?? []).length !== 2) {
    return { error: "Invalid wallet." };
  }

  const { error } = await supabase.from("wallet_transfers").insert({
    user_id: user.id,
    from_wallet_id: parsed.fromWalletId,
    to_wallet_id: parsed.toWalletId,
    amount: parsed.amount,
    currency: parsed.currency,
    transferred_on: parsed.transferredOn,
    note: parsed.note,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteTransfer(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("wallet_transfers")
    .delete()
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
