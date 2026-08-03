export type BillingCycle = "monthly" | "yearly" | "weekly";

export interface Subscription {
  id: string;
  name: string;
  price: number;
  billing_cycle: BillingCycle;
  created_at: string;
}
