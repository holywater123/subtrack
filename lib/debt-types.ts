import {
  Car,
  CreditCard,
  GraduationCap,
  HandCoins,
  ShoppingBag,
  Tag,
  type LucideIcon,
} from "lucide-react";

export interface DebtType {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const DEBT_TYPES: DebtType[] = [
  {
    value: "credit_card",
    label: "Credit Card",
    icon: CreditCard,
    color: "bg-red-500",
  },
  {
    value: "bnpl",
    label: "Buy Now Pay Later",
    icon: ShoppingBag,
    color: "bg-purple-500",
  },
  {
    value: "personal_loan",
    label: "Personal Loan",
    icon: HandCoins,
    color: "bg-orange-500",
  },
  {
    value: "student_loan",
    label: "Student Loan",
    icon: GraduationCap,
    color: "bg-indigo-500",
  },
  { value: "car_loan", label: "Car Loan", icon: Car, color: "bg-blue-500" },
  { value: "other", label: "Other", icon: Tag, color: "bg-gray-500" },
];

export const DEBT_TYPE_VALUES: string[] = DEBT_TYPES.map((d) => d.value);

// Credit Card / BNPL move to being tracked as wallets instead (with real
// credit-limit/statement fields) - not selectable for a *new* debt, but
// DEBT_TYPES/getDebtType above still cover any pre-existing one so it
// keeps rendering correctly.
export const ADDABLE_DEBT_TYPES: DebtType[] = DEBT_TYPES.filter(
  (d) => d.value !== "credit_card" && d.value !== "bnpl"
);

const OTHER_DEBT_TYPE = DEBT_TYPES[DEBT_TYPES.length - 1];

export function getDebtType(value: string): DebtType {
  return DEBT_TYPES.find((d) => d.value === value) ?? OTHER_DEBT_TYPE;
}
