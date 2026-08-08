"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { DEBT_TYPE_VALUES } from "@/lib/debt-types";
import { isCreditWallet } from "@/lib/wallet-types";

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
  revalidatePath("/dashboard/wallets");
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

// Pays down either a real `debts` row or a credit-card/pay_later wallet's
// outstanding_balance, always debited from a chosen source wallet so the
// money leaving that account is real (reflected in its own balance via
// debt_payments, see wallets/page.tsx). Interest is real money spent -
// unlike the rest of the payment (which just cancels debt already
// reflected in past purchases), it's new cost with nothing else
// accounting for it, so it's the only part logged as a real expense. The
// target's balance always drops by the full payment amount regardless,
// matching what the user actually sees on their statement.
export async function payDebt(
  targetKind: "debt" | "wallet",
  targetId: string,
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

  const sourceWalletId = String(formData.get("sourceWalletId") ?? "");
  if (!sourceWalletId) {
    return { error: "Choose an account to pay from." };
  }
  if (sourceWalletId === targetId) {
    return { error: "Choose a different account to pay from." };
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

  const { data: sourceWallet, error: sourceFetchError } = await supabase
    .from("wallets")
    .select("id, wallet_type")
    .eq("id", sourceWalletId)
    .eq("user_id", user.id)
    .single();

  if (sourceFetchError || !sourceWallet) return { error: "Source account not found." };
  if (isCreditWallet(sourceWallet.wallet_type)) {
    return { error: "Choose a bank, e-wallet, or cash account to pay from." };
  }

  let targetName: string;
  let targetCurrency: string;
  let currentBalance: number;

  if (targetKind === "debt") {
    const { data: debt, error: fetchError } = await supabase
      .from("debts")
      .select("name, balance, currency")
      .eq("id", targetId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !debt) return { error: "Debt not found." };

    targetName = debt.name;
    targetCurrency = debt.currency;
    currentBalance = Number(debt.balance);
  } else {
    const { data: wallet, error: fetchError } = await supabase
      .from("wallets")
      .select("name, wallet_type, outstanding_balance, currency")
      .eq("id", targetId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !wallet) return { error: "Wallet not found." };
    if (!isCreditWallet(wallet.wallet_type)) {
      return { error: "Only credit card or Pay Later wallets can be paid this way." };
    }

    targetName = wallet.name;
    targetCurrency = wallet.currency;
    currentBalance = Number(wallet.outstanding_balance ?? 0);
  }

  // The debt_payments/expenses inserts (the writes that make the source
  // wallet's own computed balance correct) happen BEFORE the debt/wallet
  // balance update, not after. If either insert fails, the target's
  // balance hasn't been touched yet, so nothing is left inconsistent - the
  // payment simply didn't apply and can be retried. The original order
  // risked the opposite: a debt/wallet balance already reduced while a
  // failed insert left no wallet ever debited, silently reproducing the
  // "payment invisible to any wallet" bug this whole account-picker exists
  // to prevent.
  const principal = amount - interestAmount;
  if (principal > 0) {
    const { error: paymentError } = await supabase.from("debt_payments").insert({
      user_id: user.id,
      source_wallet_id: sourceWalletId,
      target_debt_id: targetKind === "debt" ? targetId : null,
      target_wallet_id: targetKind === "wallet" ? targetId : null,
      amount: principal,
      currency: targetCurrency,
    });
    if (paymentError) return { error: paymentError.message };
  }

  if (interestAmount > 0) {
    const { error: expenseError } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount: interestAmount,
      currency: targetCurrency,
      category: "finance",
      spent_on: new Date().toISOString().slice(0, 10),
      note: `Interest on ${targetName}`,
      wallet_id: sourceWalletId,
      debt_id: targetKind === "debt" ? targetId : null,
    });
    if (expenseError) return { error: expenseError.message };
  }

  const newBalance = Math.max(0, currentBalance - amount);
  const { error: updateError } =
    targetKind === "debt"
      ? await supabase
          .from("debts")
          .update({ balance: newBalance })
          .eq("id", targetId)
          .eq("user_id", user.id)
      : await supabase
          .from("wallets")
          .update({ outstanding_balance: newBalance })
          .eq("id", targetId)
          .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

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
