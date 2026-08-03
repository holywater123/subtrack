import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { monthlyEquivalentInBase } from "@/lib/subscription-math";
import { getCategory } from "@/lib/categories";
import { BASE_CURRENCY } from "@/lib/finance-summary";
import type { Subscription } from "@/lib/types";

const CACHE_HOURS = 24;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku";

const FALLBACK_NO_DATA =
  "Log a few expenses to get personalized spending insights.";
const FALLBACK_ERROR =
  "Spending insight isn't available right now - check back later.";

function monthsAgoISODate(n: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - n, 1)
    .toISOString()
    .slice(0, 10);
}

// Cached per-user in `ai_insights`, regenerated at most once every
// CACHE_HOURS to keep OpenRouter usage low and predictable.
export async function getSpendingInsight(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FALLBACK_ERROR;

  const { data: cached } = await supabase
    .from("ai_insights")
    .select("content, generated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cached) {
    const ageHours =
      (Date.now() - new Date(cached.generated_at).getTime()) / 3_600_000;
    if (ageHours < CACHE_HOURS) return cached.content;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return FALLBACK_NO_DATA;

  const since = monthsAgoISODate(3);
  const [{ data: expensesData }, { data: subscriptionsData }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select("amount, currency, category, spent_on")
        .gte("spent_on", since),
      supabase.from("subscriptions").select("*"),
    ]);

  const expenses = expensesData ?? [];
  if (expenses.length === 0) {
    return FALLBACK_NO_DATA;
  }

  try {
    const rates = await getExchangeRates(BASE_CURRENCY);
    const subscriptions = (subscriptionsData ?? []) as Subscription[];

    const byMonth: Record<string, Record<string, number>> = {};
    for (const e of expenses) {
      const month = String(e.spent_on).slice(0, 7);
      const amount = convertToBase(e.amount, e.currency, rates);
      byMonth[month] ??= {};
      byMonth[month][e.category] = (byMonth[month][e.category] ?? 0) + amount;
    }

    const monthlyBreakdown = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, categories]) => {
        const lines = Object.entries(categories)
          .map(([cat, amt]) => `${getCategory(cat).label}: ${amt.toFixed(2)}`)
          .join(", ");
        return `${month}: ${lines}`;
      })
      .join("\n");

    const activeSubs =
      subscriptions
        .filter((s) => !s.is_paused)
        .map(
          (s) =>
            `${s.name} (${getCategory(s.category).label}, ${monthlyEquivalentInBase(s, rates).toFixed(2)}/mo)`
        )
        .join(", ") || "none";

    const prompt = `You are a personal finance assistant. All amounts are in ${BASE_CURRENCY}.

Recurring subscriptions: ${activeSubs}

One-off expenses by month and category (last 3 months):
${monthlyBreakdown}

In 1-3 short sentences, point out the most notable spending pattern or change, and give one concrete piece of advice. Be specific and use the numbers. No greetings, no markdown, plain text only.`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouter returned ${response.status}`);
    }

    const data = await response.json();
    const content: string | undefined =
      data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty response from OpenRouter");

    await supabase.from("ai_insights").upsert({
      user_id: user.id,
      content,
      generated_at: new Date().toISOString(),
    });

    return content;
  } catch {
    return FALLBACK_ERROR;
  }
}
