import type { Debt, Wallet } from "@/lib/types";
import { getDebtType } from "@/lib/debt-types";
import { getWalletType, isCreditWallet } from "@/lib/wallet-types";

// Normalizes a real `debts` row and a credit-card/pay_later wallet into the
// same shape so they can render in one combined "everything you owe" list -
// the credit-card wallet is still owned/edited from the Wallets tab, this is
// just a payable view of the same outstanding_balance.
export interface DebtListItem {
  kind: "debt" | "wallet";
  id: string;
  name: string;
  typeValue: string;
  balance: number;
  currency: string;
  interestRate: number | null;
  dueDate: string | null;
  creditLimit: number | null;
  // The original row - debts.tsx uses this to prefill the edit dialog for
  // kind "debt" (credit-card wallets are edited from the Wallets tab only).
  source: Debt | Wallet;
}

export function getDebtListItemType(item: DebtListItem) {
  return item.kind === "wallet" ? getWalletType(item.typeValue) : getDebtType(item.typeValue);
}

// Clamps day-of-month overflow (e.g. 31 in February) to the month's last day
// instead of letting the Date constructor silently roll into the next month.
function dateForDay(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

// Formats using LOCAL date parts, not toISOString() (which converts to UTC
// first - for any timezone ahead of UTC, a local midnight date would
// silently shift back a calendar day, e.g. Aug 15 local -> Aug 14 in UTC).
function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// The next occurrence (today or later) of a recurring day-of-month due date.
export function nextDueDateFromDay(day: number, today = new Date()): string {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let candidate = dateForDay(today.getFullYear(), today.getMonth(), day);
  if (candidate < todayStart) {
    candidate = dateForDay(today.getFullYear(), today.getMonth() + 1, day);
  }
  return toLocalISODate(candidate);
}

export function debtsAndCreditWalletsToItems(
  debts: Debt[],
  wallets: Wallet[]
): DebtListItem[] {
  const debtItems: DebtListItem[] = debts.map((d) => ({
    kind: "debt",
    id: d.id,
    name: d.name,
    typeValue: d.debt_type,
    balance: d.balance,
    currency: d.currency,
    interestRate: d.interest_rate,
    dueDate: d.due_date,
    creditLimit: null,
    source: d,
  }));

  const walletItems: DebtListItem[] = wallets
    .filter((w) => isCreditWallet(w.wallet_type))
    .map((w) => ({
      kind: "wallet",
      id: w.id,
      name: w.name,
      typeValue: w.wallet_type,
      balance: w.outstanding_balance ?? 0,
      currency: w.currency,
      interestRate: null,
      dueDate: w.payment_due_day ? nextDueDateFromDay(w.payment_due_day) : null,
      creditLimit: w.credit_limit,
      source: w,
    }));

  return [...debtItems, ...walletItems];
}
