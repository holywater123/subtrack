import { createClient } from "@/lib/supabase/server";
import type { Subscription } from "@/lib/types";

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

// billingDay is a fixed anchor read from the subscription row, never
// derived from the date being advanced - that's what keeps a subscription
// billed on e.g. the 31st snapping back to the 31st in every 31-day month
// instead of permanently drifting to an earlier day the first time it
// passes through a shorter month.
function addCycle(
  dateStr: string,
  cycle: Subscription["billing_cycle"],
  billingDay: number
): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (cycle === "daily") {
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (cycle === "weekly") {
    d.setUTCDate(d.getUTCDate() + 7);
    return d.toISOString().slice(0, 10);
  }
  const monthsToAdd = cycle === "yearly" ? 12 : 1;
  const targetMonthIndex = d.getUTCMonth() + monthsToAdd;
  const daysInTargetMonth = new Date(
    Date.UTC(d.getUTCFullYear(), targetMonthIndex + 1, 0)
  ).getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(targetMonthIndex);
  d.setUTCDate(Math.min(billingDay, daysInTargetMonth));
  return d.toISOString().slice(0, 10);
}

// Lazily syncs subscription billing state - same "read, mutate what's due"
// idiom as lib/achievements.ts and lib/receipt-cleanup.ts, called from
// wherever subscription-derived data is read rather than on a schedule.
//
// 1. Auto-resumes any subscription whose pause-until date has passed.
// 2. Advances each non-paused subscription's next_billing_date up to
//    today (and no further than end_date, for subscriptions with a
//    defined term), inserting a real expense row only for the occurrence
//    that falls in the CURRENT calendar month. Older, skipped cycles (the
//    app wasn't opened for a while) are advanced past without generating
//    anything - past months are never backfilled or touched. A
//    subscription with no end_date just keeps billing indefinitely.
export async function syncSubscriptionBilling(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = monthKey(today);

  const [{ data: subscriptionsData }, { data: walletsData }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("user_id", user.id),
    supabase
      .from("wallets")
      .select("id, is_cash_pool, is_primary_spending")
      .eq("user_id", user.id),
  ]);
  const subscriptions = (subscriptionsData ?? []) as Subscription[];
  // Same default-wallet priority as a manual expense entry (see
  // expense-dialog.tsx): primary-spending wins, cash pool is the fallback.
  // Without this, an auto-billed expense row was inserted with no
  // wallet_id at all - real money left the user's account, but the app's
  // computed wallet balance (app/dashboard/wallets/page.tsx's
  // `expenseTotal`, filtered by wallet_id) never subtracted it, so the
  // computed balance silently drifted above the real one by the sum of
  // every auto-billed subscription charge.
  const wallets = walletsData ?? [];
  const defaultWalletId =
    wallets.find((w) => w.is_primary_spending)?.id ??
    wallets.find((w) => w.is_cash_pool)?.id ??
    null;

  const toResume = subscriptions.filter(
    (s) => s.is_paused && !s.paused_permanent && s.paused_until && s.paused_until <= today
  );
  for (const s of toResume) {
    await supabase
      .from("subscriptions")
      .update({ is_paused: false, paused_until: null })
      .eq("id", s.id)
      .eq("user_id", user.id);
    s.is_paused = false;
    s.paused_until = null;
  }

  for (const s of subscriptions) {
    if (s.is_paused) continue;

    let nextDate = s.next_billing_date;
    let changed = false;

    while (nextDate <= today && (!s.end_date || nextDate <= s.end_date)) {
      if (monthKey(nextDate) === currentMonth) {
        const { data: existing } = await supabase
          .from("expenses")
          .select("id")
          .eq("subscription_id", s.id)
          .eq("spent_on", nextDate)
          .maybeSingle();

        if (!existing) {
          await supabase.from("expenses").insert({
            user_id: user.id,
            amount: s.price,
            currency: s.currency,
            category: s.category,
            spent_on: nextDate,
            subscription_id: s.id,
            wallet_id: defaultWalletId,
          });
        }
      }
      nextDate = addCycle(nextDate, s.billing_cycle, s.billing_day);
      changed = true;
    }

    if (changed) {
      await supabase
        .from("subscriptions")
        .update({ next_billing_date: nextDate })
        .eq("id", s.id)
        .eq("user_id", user.id);
    }
  }
}
