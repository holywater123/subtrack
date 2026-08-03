"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { DEBT_TYPE_VALUES } from "@/lib/debt-types";

type ActionResult = { error: string } | { success: true };

function parseDebtForm(formData: FormData): ActionResult & {
  name?: string;
  debtType?: string;
  balance?: number;
  currency?: string;
  interestRate?: number | null;
  dueDate?: string | null;
} {
  const name = String(formData.get("name") ?? "").trim();
  const debtType = String(formData.get("debtType") ?? "credit_card");
  const balance = Number(formData.get("balance"));
  const currency = String(formData.get("currency") ?? "MYR");
  const interestRateRaw = String(formData.get("interestRate") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();

  if (!name) return { error: "Name is required." };
  if (!DEBT_TYPE_VALUES.includes(debtType)) {
    return { error: "Invalid debt type." };
  }
  if (!Number.isFinite(balance) || balance < 0) {
    return { error: "Enter a valid balance." };
  }
  if (!CURRENCY_CODES.includes(currency)) {
    return { error: "Invalid currency." };
  }

  let interestRate: number | null = null;
  if (interestRateRaw) {
    interestRate = Number(interestRateRaw);
    if (!Number.isFinite(interestRate) || interestRate < 0) {
      return { error: "Enter a valid interest rate." };
    }
  }

  let dueDate: string | null = null;
  if (dueDateRaw) {
    if (Number.isNaN(Date.parse(dueDateRaw))) {
      return { error: "Enter a valid due date." };
    }
    dueDate = dueDateRaw;
  }

  return {
    success: true,
    name,
    debtType,
    balance,
    currency,
    interestRate,
    dueDate,
  };
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/debts");
}

export async function addDebt(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseDebtForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase.from("debts").insert({
    user_id: user.id,
    name: parsed.name,
    debt_type: parsed.debtType,
    balance: parsed.balance,
    currency: parsed.currency,
    interest_rate: parsed.interestRate,
    due_date: parsed.dueDate,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function updateDebt(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseDebtForm(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase
    .from("debts")
    .update({
      name: parsed.name,
      debt_type: parsed.debtType,
      balance: parsed.balance,
      currency: parsed.currency,
      interest_rate: parsed.interestRate,
      due_date: parsed.dueDate,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteDebt(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}
