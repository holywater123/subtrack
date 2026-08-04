import type { Subscription } from "@/lib/types";
import { convertToBase } from "@/lib/exchange-rates";

const WEEKS_PER_MONTH = 52 / 12;
const DAYS_PER_MONTH = 365.25 / 12;

export function monthlyEquivalent(
  subscription: Pick<Subscription, "price" | "billing_cycle">
) {
  switch (subscription.billing_cycle) {
    case "yearly":
      return subscription.price / 12;
    case "weekly":
      return subscription.price * WEEKS_PER_MONTH;
    case "daily":
      return subscription.price * DAYS_PER_MONTH;
    default:
      return subscription.price;
  }
}

export function monthlyEquivalentInBase(
  subscription: Pick<Subscription, "price" | "billing_cycle" | "currency">,
  rates: Record<string, number>
) {
  return convertToBase(
    monthlyEquivalent(subscription),
    subscription.currency,
    rates
  );
}
