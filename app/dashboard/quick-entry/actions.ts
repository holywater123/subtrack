"use server";

import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { CATEGORY_VALUES } from "@/lib/categories";
import { INCOME_CATEGORY_VALUES } from "@/lib/income-categories";

type ParseResult =
  | { error: string }
  | {
      success: true;
      type: "expense" | "income";
      amount: number;
      currency: string;
      category: string;
      date: string;
      note: string;
    };

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";
const REQUEST_TIMEOUT_MS = 20_000;

// Parses free text like "Spent 15 on coffee" or "got paid 3000 salary" into
// a draft expense/income - never inserts anything itself, just returns the
// draft for the widget to show as an editable confirmation before saving
// (same "review before it lands" contract as scanReceipt in
// app/dashboard/expenses/actions.ts). Any parse failure returns {error}
// with zero DB writes.
export async function parseQuickEntry(formData: FormData): Promise<ParseResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const text = String(formData.get("text") ?? "").trim();
  if (!text) return { error: "Type something first." };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { error: "Quick entry isn't configured yet." };

  const { data: settings } = await supabase
    .from("user_settings")
    .select("default_currency")
    .eq("user_id", user.id)
    .maybeSingle();
  const fallbackCurrency = settings?.default_currency ?? "MYR";

  const today = new Date().toISOString().slice(0, 10);
  const expenseCategoryList = CATEGORY_VALUES.join(", ");
  const incomeCategoryList = INCOME_CATEGORY_VALUES.join(", ");

  const prompt = `Today's date is ${today}. Read this short note about a single financial transaction and respond with ONLY a JSON object (no markdown, no explanation):
{
  "type": "expense" or "income" (is money leaving or coming in?),
  "amount": number,
  "currency": string or null (3-letter code, guess from context/symbols, null if unsure),
  "category": string or null (if type is "expense", pick the single closest match from: ${expenseCategoryList}; if type is "income", pick from: ${incomeCategoryList}; null if unsure),
  "date": string or null (YYYY-MM-DD, resolve relative terms like "today"/"yesterday" against ${today}, null if unclear),
  "note": string (a short description, under 60 characters)
}
Note: "${text}"`;

  try {
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
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouter returned ${response.status}`);
    }

    const data = await response.json();
    const content: string | undefined = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenRouter");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);

    const type: "expense" | "income" | null =
      parsed.type === "income" ? "income" : parsed.type === "expense" ? "expense" : null;
    if (!type) {
      return {
        error:
          'Couldn\'t tell if that\'s an expense or income - try being more specific, e.g. "Spent 15 on coffee".',
      };
    }

    const amount = typeof parsed.amount === "number" ? parsed.amount : NaN;
    if (!Number.isFinite(amount) || amount <= 0) {
      return { error: "Couldn't find an amount - try including a number." };
    }

    const currency =
      typeof parsed.currency === "string" && CURRENCY_CODES.includes(parsed.currency)
        ? parsed.currency
        : fallbackCurrency;

    const categoryList = type === "expense" ? CATEGORY_VALUES : INCOME_CATEGORY_VALUES;
    const category =
      typeof parsed.category === "string" && categoryList.includes(parsed.category)
        ? parsed.category
        : "other";

    const date =
      typeof parsed.date === "string" && !Number.isNaN(Date.parse(parsed.date))
        ? parsed.date
        : today;

    const note = typeof parsed.note === "string" ? parsed.note.slice(0, 200) : "";

    return { success: true, type, amount, currency, category, date, note };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { error: `Couldn't understand that - try rephrasing. (${detail})` };
  }
}
