import { Banknote, Landmark, Tag, Wallet, type LucideIcon } from "lucide-react";

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
  { value: "other", label: "Other", icon: Tag, color: "bg-gray-500" },
];

export const WALLET_TYPE_VALUES: string[] = WALLET_TYPES.map((w) => w.value);

const OTHER_WALLET_TYPE = WALLET_TYPES[WALLET_TYPES.length - 1];

export function getWalletType(value: string): WalletType {
  return WALLET_TYPES.find((w) => w.value === value) ?? OTHER_WALLET_TYPE;
}
