import { createClient } from "@/lib/supabase/server";
import { getExchangeRates, convertToBase } from "@/lib/exchange-rates";
import { getFinanceSummary, BASE_CURRENCY } from "@/lib/finance-summary";
import { getCategory } from "@/lib/categories";
import { getDebtType } from "@/lib/debt-types";
import type { Debt } from "@/lib/types";

const CACHE_HOURS = 24;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku";

const FALLBACK_NO_DATA = "Add your debts to get a payoff plan.";
const FALLBACK_ERROR =
  "Debt advice isn't available right now - check back later.";

// Cached per-user in `debt_advice`, regenerated at most once every
// CACHE_HOURS to keep OpenRouter usage low and predictable.
export async function getDebtAdvice(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FALLBACK_ERROR;

  const { data: cached } = await supabase
    .from("debt_advice")
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

  const [{ data: debtsData }, { data: settingsData }, financeSummary] =
    await Promise.all([
      supabase.from("debts").select("*"),
      supabase
        .from("user_settings")
        .select("monthly_income")
        .eq("user_id", user.id)
        .maybeSingle(),
      getFinanceSummary(),
    ]);

  const debts = (debtsData ?? []) as Debt[];
  if (debts.length === 0) {
    return FALLBACK_NO_DATA;
  }

  try {
    const rates = await getExchangeRates(BASE_CURRENCY);

    const debtLines = debts
      .map((d) => {
        const balanceBase = convertToBase(d.balance, d.currency, rates);
        const rate =
          d.interest_rate !== null ? `${d.interest_rate}% interest` : "rate unknown";
        const due = d.due_date ? `due ${d.due_date}` : "no due date set";
        return `${d.name} (${getDebtType(d.debt_type).label}, ${balanceBase.toFixed(2)} ${BASE_CURRENCY}, ${rate}, ${due})`;
      })
      .join("\n");

    const totalDebt = debts.reduce(
      (sum, d) => sum + convertToBase(d.balance, d.currency, rates),
      0
    );

    const monthlyIncome = settingsData?.monthly_income
      ? `${Number(settingsData.monthly_income).toFixed(2)} ${BASE_CURRENCY}`
      : "not provided";

    const categoryBreakdown = Object.entries(financeSummary.spendByCategory)
      .filter(([, amount]) => amount > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) => `${getCategory(cat).label}: ${amount.toFixed(2)}`)
      .join(", ");

    const prompt = `You are a personal finance assistant helping prioritize debt payoff. All amounts are in ${BASE_CURRENCY}.

Monthly income: ${monthlyIncome}
Total debt: ${totalDebt.toFixed(2)}

Debts:
${debtLines}

Current monthly spending by category (fixed subscriptions + variable expenses combined): ${categoryBreakdown || "none logged yet"}

In 2-4 short sentences: recommend which debt to prioritize paying off first (favor higher interest rate when known, otherwise soonest due date), identify one or two spending categories that look reducible, and suggest a concrete monthly amount to redirect toward the top-priority debt. Be specific and use the numbers. No greetings, no markdown, plain text only.`;

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
          max_tokens: 250,
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

    await supabase.from("debt_advice").upsert({
      user_id: user.id,
      content,
      generated_at: new Date().toISOString(),
    });

    return content;
  } catch {
    return FALLBACK_ERROR;
  }
}
