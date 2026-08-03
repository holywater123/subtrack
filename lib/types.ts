export type BillingCycle = "monthly" | "yearly" | "weekly";

export interface Subscription {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_cycle: BillingCycle;
  category: string;
  is_paused: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  spent_on: string;
  note: string | null;
  receipt_path: string | null;
  receipt_uploaded_at: string | null;
  wallet_id: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  name: string;
  wallet_type: string;
  description: string | null;
  currency: string;
  starting_balance: number;
  created_at: string;
}

export interface Income {
  id: string;
  amount: number;
  currency: string;
  category: string;
  received_on: string;
  note: string | null;
  wallet_id: string | null;
  created_at: string;
}

export interface Debt {
  id: string;
  name: string;
  debt_type: string;
  balance: number;
  currency: string;
  interest_rate: number | null;
  due_date: string | null;
  created_at: string;
}
