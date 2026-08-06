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
    }
  | {
      success: true;
      type: "transfer";
      fromWalletId: string;
      fromWalletName: string;
      toWalletId: string;
      toWalletName: string;
      amount: number;
      currency: string;
      date: string;
      note: string;
    }
  | {
      success: true;
      type: "set_wallet";
      // Which flag to assign - is_cash_pool ("where cash sits") or
      // is_primary_spending ("what new expenses default to"). See
      // migration 0023_primary_spending_wallet.sql for why these are two
      // separate flags, not one.
      target: "cash_pool" | "primary_spending";
      walletId: string;
      walletName: string;
    };

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";
const REQUEST_TIMEOUT_MS = 20_000;

interface WalletRef {
  id: string;
  name: string;
}

// Resolves a name the AI produced back to a real wallet the user actually
// owns - the AI is never trusted to invent or guess an id itself, only to
// echo back a name from the list it was given. An exact (case-insensitive)
// match wins, but only if it's unique - nothing stops a user from naming
// two wallets identically, and picking "whichever came first" in that case
// would be exactly the kind of silent wrong-wallet mistake this app exists
// to prevent. A unique partial match is accepted (so "maybank" matches
// "Maybank Savings"), but only for names of 3+ characters on both sides -
// short wallet names (e.g. "SO") could otherwise spuriously "uniquely"
// substring-match unrelated AI output. Anything ambiguous, too short, or
// unmatched returns null and the caller must surface an error.
function matchWallet(name: unknown, wallets: WalletRef[]): WalletRef | null {
  if (typeof name !== "string") return null;
  const norm = name.trim().toLowerCase();
  if (!norm) return null;

  const exact = wallets.filter((w) => w.name.toLowerCase() === norm);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;

  if (norm.length < 3) return null;

  const partial = wallets.filter((w) => {
    const wn = w.name.toLowerCase();
    if (wn.length < 3) return false;
    return wn.includes(norm) || norm.includes(wn);
  });
  return partial.length === 1 ? partial[0] : null;
}

// Parses free text into a draft action - expense/income, a wallet-to-wallet
// transfer, or reassigning the cash-pool/primary-spending wallet. Never
// inserts or mutates anything itself, only ever returns a draft for the
// widget to show as an editable confirmation before the user explicitly
// saves it (same "review before it lands" contract as scanReceipt in
// app/dashboard/expenses/actions.ts). Any parse failure, or any wallet name
// that can't be confidently matched, returns {error} with zero DB writes.
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

  const [{ data: settings }, { data: walletsData }] = await Promise.all([
    supabase
      .from("user_settings")
      .select("default_currency")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("wallets").select("id, name").eq("user_id", user.id),
  ]);
  const fallbackCurrency = settings?.default_currency ?? "MYR";
  const wallets: WalletRef[] = walletsData ?? [];
  const walletNameList = wallets.map((w) => w.name).join(", ") || "(none)";

  const today = new Date().toISOString().slice(0, 10);
  const expenseCategoryList = CATEGORY_VALUES.join(", ");
  const incomeCategoryList = INCOME_CATEGORY_VALUES.join(", ");

  const prompt = `Today's date is ${today}. This app manages a personal finance tracker. The user's wallets are: ${walletNameList}.
Read this short instruction and respond with ONLY a JSON object (no markdown, no explanation) describing what the user wants to do. Pick the single closest "action":

- "expense" or "income": logging a transaction (money leaving or coming in)
- "transfer": moving money from one of the user's wallets to another
- "set_wallet": changing which wallet is the default "cash pool" (where cash sits) or "primary spending" wallet (what new expenses default to)

Respond with ONLY one of these shapes, matching the action:

For expense/income:
{ "action": "expense" or "income", "amount": number, "currency": string or null (3-letter code, null if unsure), "category": string or null (if expense pick the single closest match from: ${expenseCategoryList}; if income pick from: ${incomeCategoryList}; null if unsure), "date": string or null (YYYY-MM-DD, resolve relative terms like "today"/"yesterday" against ${today}, null if unclear), "note": string (short description, under 60 characters) }

For transfer:
{ "action": "transfer", "fromWallet": string (name, must be one of the wallets listed above), "toWallet": string (name, must be one of the wallets listed above), "amount": number, "currency": string or null, "date": string or null, "note": string }

For set_wallet:
{ "action": "set_wallet", "target": "cash_pool" or "primary_spending", "wallet": string (name, must be one of the wallets listed above) }

If the instruction doesn't clearly match any of these, respond with { "action": "unknown" }.

Instruction: "${text}"`;

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
          max_tokens: 250,
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

    const action = typeof parsed.action === "string" ? parsed.action : null;

    if (action === "transfer") {
      const fromWallet = matchWallet(parsed.fromWallet, wallets);
      const toWallet = matchWallet(parsed.toWallet, wallets);
      if (!fromWallet || !toWallet) {
        return {
          error:
            "Couldn't match that to two of your wallets by name - try using their exact names.",
        };
      }
      if (fromWallet.id === toWallet.id) {
        return { error: "Source and destination wallets are the same." };
      }
      const amount = typeof parsed.amount === "number" ? parsed.amount : NaN;
      if (!Number.isFinite(amount) || amount <= 0) {
        return { error: "Couldn't find an amount - try including a number." };
      }
      const currency =
        typeof parsed.currency === "string" && CURRENCY_CODES.includes(parsed.currency)
          ? parsed.currency
          : fallbackCurrency;
      const date =
        typeof parsed.date === "string" && !Number.isNaN(Date.parse(parsed.date))
          ? parsed.date
          : today;
      const note = typeof parsed.note === "string" ? parsed.note.slice(0, 200) : "";

      return {
        success: true,
        type: "transfer",
        fromWalletId: fromWallet.id,
        fromWalletName: fromWallet.name,
        toWalletId: toWallet.id,
        toWalletName: toWallet.name,
        amount,
        currency,
        date,
        note,
      };
    }

    if (action === "set_wallet") {
      const target =
        parsed.target === "cash_pool" || parsed.target === "primary_spending"
          ? parsed.target
          : null;
      const wallet = matchWallet(parsed.wallet, wallets);
      if (!target || !wallet) {
        return {
          error:
            "Couldn't match that to one of your wallets by name - try using its exact name.",
        };
      }
      return {
        success: true,
        type: "set_wallet",
        target,
        walletId: wallet.id,
        walletName: wallet.name,
      };
    }

    if (action === "expense" || action === "income") {
      const type = action;
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
    }

    return {
      error:
        'Couldn\'t tell what you wanted to do - try being more specific, e.g. "Spent 15 on coffee" or "Transfer 200 from Cash to Maybank".',
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { error: `Couldn't understand that - try rephrasing. (${detail})` };
  }
}
