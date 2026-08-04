import {
  Banknote,
  CreditCard,
  Landmark,
  ShoppingBag,
  Tag,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface WalletType {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const WALLET_TYPES: WalletType[] = [
  { value: "bank", label: "Bank Account", icon: Landmark, color: "bg-blue-500" },
  { value: "ewallet", label: "E-Wallet", icon: Wallet, color: "bg-violet-500" },
  { value: "cash", label: "Cash", icon: Banknote, color: "bg-emerald-500" },
  { value: "credit_card", label: "Credit Card", icon: CreditCard, color: "bg-red-500" },
  { value: "pay_later", label: "Pay Later (BNPL)", icon: ShoppingBag, color: "bg-purple-500" },
  { value: "other", label: "Other", icon: Tag, color: "bg-gray-500" },
];

export const WALLET_TYPE_VALUES: string[] = WALLET_TYPES.map((w) => w.value);

// Wallet types with real credit-line fields (statement/outstanding
// balance, credit limit, due date) instead of a plain running balance -
// they don't participate in the cash-on-hand math at all.
export const CREDIT_WALLET_TYPES = ["credit_card", "pay_later"];

export function isCreditWallet(walletType: string): boolean {
  return CREDIT_WALLET_TYPES.includes(walletType);
}

const OTHER_WALLET_TYPE = WALLET_TYPES[WALLET_TYPES.length - 1];

export function getWalletType(value: string): WalletType {
  return WALLET_TYPES.find((w) => w.value === value) ?? OTHER_WALLET_TYPE;
}
