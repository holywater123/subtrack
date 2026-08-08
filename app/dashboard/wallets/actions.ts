"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { WALLET_TYPE_VALUES, isCreditWallet } from "@/lib/wallet-types";

type ActionResult = { error: string } | { success: true };

function parseOptionalNumber(
  raw: FormDataEntryValue | null
): number | null | undefined {
  const str = String(raw ?? "").trim();
  if (!str) return null;
  const num = Number(str);
  if (!Number.isFinite(num)) return undefined;
  return num;
}

function parseWalletForm(formData: FormData): ActionResult & {
  name?: string;
  walletType?: string;
  currency?: string;
  startingBalance?: number;
  description?: string | null;
  statementBalance?: number | null;
  outstandingBalance?: number | null;
  creditLimit?: number | null;
  paymentDueDay?: number | null;
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

  let statementBalance: number | null = null;
  let outstandingBalance: number | null = null;
  let creditLimit: number | null = null;
  let paymentDueDay: number | null = null;

  if (isCreditWallet(walletType)) {
    statementBalance = parseOptionalNumber(formData.get("statementBalance")) ?? null;
    if (statementBalance === undefined) {
      return { error: "Enter a valid statement balance." };
    }
    outstandingBalance = parseOptionalNumber(formData.get("outstandingBalance")) ?? null;
    if (outstandingBalance === undefined) {
      return { error: "Enter a valid outstanding balance." };
    }
    if (outstandingBalance === null) {
      return { error: "Outstanding balance is required." };
    }
    creditLimit = parseOptionalNumber(formData.get("creditLimit")) ?? null;
    if (creditLimit === undefined) {
      return { error: "Enter a valid credit limit." };
    }
    const dueDayRaw = String(formData.get("paymentDueDay") ?? "").trim();
    if (dueDayRaw) {
      const dueDay = Number(dueDayRaw);
      if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
        return { error: "Payment due date must be between 1 and 31." };
      }
      paymentDueDay = dueDay;
    }
  }

  return {
    success: true,
    name,
    walletType,
    currency,
    startingBalance,
    description: description || null,
    statementBalance,
    outstandingBalance,
    creditLimit,
    paymentDueDay,
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
    statement_balance: parsed.statementBalance,
    outstanding_balance: parsed.outstandingBalance,
    credit_limit: parsed.creditLimit,
    payment_due_day: parsed.paymentDueDay,
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
      statement_balance: parsed.statementBalance,
      outstanding_balance: parsed.outstandingBalance,
      credit_limit: parsed.creditLimit,
      payment_due_day: parsed.paymentDueDay,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

type WalletFlagColumn = "is_cash_pool" | "is_primary_spending";

// Shared by both the toggle* actions (manual icon click - flips the
// current wallet's flag) and the set* actions (AI quick entry - always
// assigns, never unsets, since "set my Maybank card as primary spending"
// has no sane reading as "unset it"). Only one wallet can hold a given
// flag at a time (see the wallets_one_cash_pool_idx / _primary_spending_idx
// partial unique indexes) - clear any existing holder first, then
// conditionally re-set. The second update is verified via `.select().
// maybeSingle()`: if the wallet was deleted between the initial lookup and
// here (or RLS otherwise blocks it), the clear would otherwise silently
// leave nobody flagged while still returning {success: true}.
async function applyWalletFlag(
  id: string,
  column: WalletFlagColumn,
  nextValue: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wallet) return { error: "Wallet not found." };

  const { error: clearError } = await supabase
    .from("wallets")
    .update({ [column]: false })
    .eq("user_id", user.id);

  if (clearError) return { error: clearError.message };

  if (nextValue) {
    const { data: updated, error } = await supabase
      .from("wallets")
      .update({ [column]: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (error) return { error: error.message };
    if (!updated) {
      return { error: "Wallet was removed - nothing was set." };
    }
  }

  revalidateAll();
  return { success: true };
}

export async function setCashPoolWallet(id: string): Promise<ActionResult> {
  return applyWalletFlag(id, "is_cash_pool", true);
}

export async function setPrimarySpendingWallet(
  id: string
): Promise<ActionResult> {
  return applyWalletFlag(id, "is_primary_spending", true);
}

async function toggleWalletFlag(
  id: string,
  column: WalletFlagColumn
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: wallet } = await supabase
    .from("wallets")
    .select(column)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wallet) return { error: "Wallet not found." };

  const currentValue = (wallet as Record<WalletFlagColumn, boolean>)[column];
  return applyWalletFlag(id, column, !currentValue);
}

export async function toggleCashPoolWallet(id: string): Promise<ActionResult> {
  return toggleWalletFlag(id, "is_cash_pool");
}

export async function togglePrimarySpendingWallet(
  id: string
): Promise<ActionResult> {
  return toggleWalletFlag(id, "is_primary_spending");
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

// Converting moves an amount OUT of the card's revolving outstanding_balance
// INTO a fixed-term installment plan - net available credit is unchanged at
// the moment of conversion (same debt, different terms), it only frees up as
// installments get paid down.
export async function createBalanceTransfer(
  walletId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }

  const termMonths = Number(formData.get("termMonths"));
  if (!Number.isInteger(termMonths) || termMonths <= 0) {
    return { error: "Enter a valid term in months." };
  }

  const totalInterestRaw = String(formData.get("totalInterest") ?? "").trim();
  let totalInterest = 0;
  if (totalInterestRaw) {
    totalInterest = Number(totalInterestRaw);
    if (!Number.isFinite(totalInterest) || totalInterest < 0) {
      return { error: "Enter a valid interest amount." };
    }
  }

  const name = String(formData.get("name") ?? "").trim();

  const { data: wallet, error: fetchError } = await supabase
    .from("wallets")
    .select("wallet_type, outstanding_balance, currency")
    .eq("id", walletId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !wallet) return { error: "Wallet not found." };
  if (!isCreditWallet(wallet.wallet_type)) {
    return { error: "Only credit card or Pay Later wallets support balance transfers." };
  }

  const outstanding = Number(wallet.outstanding_balance ?? 0);
  if (amount > outstanding) {
    return { error: "Amount can't exceed the outstanding balance." };
  }

  const { error: updateError } = await supabase
    .from("wallets")
    .update({ outstanding_balance: outstanding - amount })
    .eq("id", walletId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  const { error: insertError } = await supabase.from("balance_transfers").insert({
    user_id: user.id,
    wallet_id: walletId,
    name: name || null,
    currency: wallet.currency,
    original_amount: amount,
    total_interest: totalInterest,
    term_months: termMonths,
    remaining_balance: amount + totalInterest,
  });

  if (insertError) return { error: insertError.message };

  revalidateAll();
  return { success: true };
}

// Only the interest portion of an installment is logged as a real expense -
// same reasoning as payDebt: the rest just cancels debt already reflected in
// whatever was originally charged to the card, so logging it again would
// double-count. Interest is the plan's fixed total_interest/term_months
// share, capped at whatever the payment actually covers.
//
// Mirrors payDebt's account-picker pattern (a source wallet is required,
// and the principal portion becomes a debt_payments row so it reduces that
// wallet's computed balance) - this used to have neither: no source wallet
// at all, and the interest expense wasn't linked to any wallet_id either,
// so paying an installment had zero effect on any wallet's computed
// balance even though real money left a real account.
export async function payInstallment(
  transferId: string,
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

  const { data: transfer, error: fetchError } = await supabase
    .from("balance_transfers")
    .select(
      "wallet_id, name, currency, remaining_balance, total_interest, term_months, installments_paid"
    )
    .eq("id", transferId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !transfer) return { error: "Balance transfer not found." };

  if (sourceWalletId === transfer.wallet_id) {
    return { error: "Choose a different account to pay from." };
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

  const remainingBalance = Number(transfer.remaining_balance);
  if (amount > remainingBalance) {
    return { error: "Payment can't exceed the remaining balance." };
  }

  const interestPerInstallment =
    transfer.term_months > 0 ? Number(transfer.total_interest) / transfer.term_months : 0;
  const interestPortion = Math.min(interestPerInstallment, amount);
  const principal = amount - interestPortion;
  const newRemaining = Math.max(0, remainingBalance - amount);

  // debt_payments is inserted BEFORE the balance_transfers update - if this
  // insert fails, nothing else has changed yet, so the transfer's own
  // remaining_balance/installments_paid stay untouched and the payment can
  // simply be retried. Doing it in the other order (as originally written)
  // meant a failed debt_payments insert left remaining_balance already
  // decremented with no wallet ever debited - silently reproducing the
  // exact "payment invisible to any wallet" bug this function exists to
  // fix, and compounding on retry.
  if (principal > 0) {
    // target_wallet_id, not target_debt_id - a balance transfer plan isn't
    // its own `debts` row, it's still debt against the credit-card wallet
    // it was converted from (balance_transfers.wallet_id), same as paying
    // that card directly via payDebt's "wallet" target kind.
    const { error: paymentError } = await supabase.from("debt_payments").insert({
      user_id: user.id,
      source_wallet_id: sourceWalletId,
      target_debt_id: null,
      target_wallet_id: transfer.wallet_id,
      amount: principal,
      currency: transfer.currency,
    });
    if (paymentError) return { error: paymentError.message };
  }

  const { error: updateError } = await supabase
    .from("balance_transfers")
    .update({
      remaining_balance: newRemaining,
      installments_paid: transfer.installments_paid + 1,
    })
    .eq("id", transferId)
    .eq("user_id", user.id);

  if (updateError) return { error: updateError.message };

  if (interestPortion > 0) {
    const { error: expenseError } = await supabase.from("expenses").insert({
      user_id: user.id,
      amount: interestPortion,
      currency: transfer.currency,
      category: "finance",
      spent_on: new Date().toISOString().slice(0, 10),
      note: `Interest on ${transfer.name ?? "balance transfer"}`,
      wallet_id: sourceWalletId,
      balance_transfer_id: transferId,
    });
    if (expenseError) return { error: expenseError.message };
  }

  revalidateAll();
  revalidatePath("/dashboard/expenses");
  return { success: true };
}

export async function deleteBalanceTransfer(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("balance_transfers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

// Creates a signed wallet_adjustments row (see migration
// 0024_wallet_adjustments.sql) so a wallet's computed balance can be
// nudged to match the user's real account. `currentBalance` is what the
// wallet card is showing right now (trusted the same way every other
// user-entered amount in this app is - it's the user's own wallet, and
// they can always redo an adjustment if it's wrong); `targetBalance` is
// what they typed as the real balance. The stored delta is
// targetBalance - currentBalance, in the wallet's own currency. Excludes
// credit/pay-later wallets - those track outstanding_balance, not this
// cash-balance formula, so "reconciling" them doesn't apply the same way.
export async function reconcileWallet(
  walletId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const targetBalance = Number(formData.get("targetBalance"));
  if (!Number.isFinite(targetBalance)) {
    return { error: "Enter a valid balance." };
  }
  const currentBalance = Number(formData.get("currentBalance"));
  if (!Number.isFinite(currentBalance)) {
    return { error: "Missing current balance." };
  }
  const note = String(formData.get("note") ?? "").trim() || null;

  const { data: wallet } = await supabase
    .from("wallets")
    .select("id, currency, wallet_type")
    .eq("id", walletId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wallet) return { error: "Wallet not found." };
  if (isCreditWallet(wallet.wallet_type)) {
    return {
      error:
        "Credit card and Pay Later balances are tracked separately - edit the outstanding balance instead.",
    };
  }

  const amount = Math.round((targetBalance - currentBalance) * 100) / 100;
  if (amount === 0) {
    return { error: "Already matches - nothing to adjust." };
  }

  const { error } = await supabase.from("wallet_adjustments").insert({
    user_id: user.id,
    wallet_id: walletId,
    amount,
    currency: wallet.currency,
    note,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteAdjustment(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("wallet_adjustments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}
