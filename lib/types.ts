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
