"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { CATEGORY_VALUES } from "@/lib/categories";

type ActionResult = { error: string } | { success: true };

function parseExpenseForm(formData: FormData): ActionResult & {
  amount?: number;
  currency?: string;
  category?: string;
  spentOn?: string;
  note?: string | null;
} {
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "MYR");
  const category = String(formData.get("category") ?? "other");
  const spentOn = String(formData.get("spentOn") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (!CURRENCY_CODES.includes(currency)) {
    return { error: "Invalid currency." };
  }
  if (!CATEGORY_VALUES.includes(category)) {
    return { error: "Invalid category." };
  }
  if (!spentOn || Number.isNaN(Date.parse(spentOn))) {
    return { error: "Enter a valid date." };
  }

  return {
    success: true,
    amount,
    currency,
    category,
    spentOn,
    note: note || null,
  };
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/budgets");
}

export async function addExpense(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseExpenseForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    amount: parsed.amount,
    currency: parsed.currency,
    category: parsed.category,
    spent_on: parsed.spentOn,
    note: parsed.note,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function updateExpense(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseExpenseForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase
    .from("expenses")
    .update({
      amount: parsed.amount,
      currency: parsed.currency,
      category: parsed.category,
      spent_on: parsed.spentOn,
      note: parsed.note,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}
