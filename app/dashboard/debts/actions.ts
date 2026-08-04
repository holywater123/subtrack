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

// Interest is real money spent - unlike the rest of the payment (which
// just cancels debt already reflected in past purchases), it's new cost
// with nothing else accounting for it, so it's the only part logged as
// an expense. The balance always drops by the full payment amount
// regardless, matching what the user actually sees on their statement.
export async function payDebt(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid payment amount." };
  }

  const interestRaw = String(formData.get("interestAmount") ?? "").trim();
  let interestAmount = 0;
  if (interestRaw) {
    interestAmount = Number(interestRaw);
    if (!Number.isFinite(interestAmount) || interestAmount < 0) {
      return { error: "Enter a valid interest amount." };
    }
    if (interestAmount > amount) {
      return { error: "Interest can't be more than the payment." };
    }
  }

  const { data: debt, error: fetchError } = await supabase
    .from("debts")
    .select("name, balance, currency")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !debt) return { error: "Debt not found." };

  const newBalance = Math.max(0, Number(debt.balance) - amount);

  const { error: updateError } = await supabase
    .from("debts")
    .update({ balance: newBalance })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  if (interestAmount > 0) {
    const { error: expenseError } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount: interestAmount,
      currency: debt.currency,
      category: "finance",
      spent_on: new Date().toISOString().slice(0, 10),
      note: `Interest on ${debt.name}`,
      debt_id: id,
    });
    if (expenseError) return { error: expenseError.message };
  }

  revalidateAll();
  revalidatePath("/dashboard/expenses");
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
