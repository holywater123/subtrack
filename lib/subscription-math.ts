import type { Subscription } from "@/lib/types";

const WEEKS_PER_MONTH = 52 / 12;

export function monthlyEquivalent(
  subscription: Pick<Subscription, "price" | "billing_cycle">
) {
  switch (subscription.billing_cycle) {
    case "yearly":
      return subscription.price / 12;
    case "weekly":
      return subscription.price * WEEKS_PER_MONTH;
    default:
      return subscription.price;
  }
}
