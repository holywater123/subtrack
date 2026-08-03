"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCY_CODES } from "@/lib/currencies";
import { CATEGORY_VALUES, CATEGORIES } from "@/lib/categories";

type ActionResult = { error: string } | { success: true };

async function resolveWalletId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  walletIdRaw: string
): Promise<{ error: string } | { walletId: string | null }> {
  if (!walletIdRaw || walletIdRaw === "none") return { walletId: null };

  const { data } = await supabase
    .from("wallets")
    .select("id")
    .eq("id", walletIdRaw)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return { error: "Invalid wallet." };
  return { walletId: data.id };
}

function parseExpenseForm(formData: FormData): ActionResult & {
  amount?: number;
  currency?: string;
  category?: string;
  spentOn?: string;
  note?: string | null;
  walletIdRaw?: string;
} {
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "MYR");
  const category = String(formData.get("category") ?? "other");
  const spentOn = String(formData.get("spentOn") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const walletIdRaw = String(formData.get("walletId") ?? "none");

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (!CURRENCY_CODES.includes(currency)) {
    return { error: "Invalid currency." };
  }
  if (!CATEGORY_VALUES.includes(category)) {
    return { error: "Invalid category." };
  }
  if (!spentOn || Number.isNaN(Date.parse(spentOn))) {
    return { error: "Enter a valid date." };
  }

  return {
    success: true,
    amount,
    currency,
    category,
    spentOn,
    note: note || null,
    walletIdRaw,
  };
}

function revalidateAll() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/budgets");
}

export async function addExpense(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseExpenseForm(formData);
  if ("error" in parsed) return parsed;

  const walletResolved = await resolveWalletId(
    supabase,
    user.id,
    parsed.walletIdRaw!
  );
  if ("error" in walletResolved) return walletResolved;

  const receiptPath = String(formData.get("receiptPath") ?? "").trim() || null;

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    amount: parsed.amount,
    currency: parsed.currency,
    category: parsed.category,
    spent_on: parsed.spentOn,
    note: parsed.note,
    receipt_path: receiptPath,
    receipt_uploaded_at: receiptPath ? new Date().toISOString() : null,
    wallet_id: walletResolved.walletId,
  });

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function updateExpense(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const parsed = parseExpenseForm(formData);
  if ("error" in parsed) return parsed;

  const walletResolved = await resolveWalletId(
    supabase,
    user.id,
    parsed.walletIdRaw!
  );
  if ("error" in walletResolved) return walletResolved;

  const receiptPath = String(formData.get("receiptPath") ?? "").trim() || null;

  const update: Record<string, unknown> = {
    amount: parsed.amount,
    currency: parsed.currency,
    category: parsed.category,
    spent_on: parsed.spentOn,
    note: parsed.note,
    wallet_id: walletResolved.walletId,
  };
  // Only touch the receipt fields if a new one was scanned in this edit -
  // otherwise leave whatever receipt was already attached alone.
  if (receiptPath) {
    update.receipt_path = receiptPath;
    update.receipt_uploaded_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("expenses")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: existing } = await supabase
    .from("expenses")
    .select("receipt_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  if (existing?.receipt_path) {
    await supabase.storage.from("receipts").remove([existing.receipt_path]);
  }

  revalidateAll();
  return { success: true };
}

interface ScanResult {
  receiptPath: string;
  amount?: number;
  currency?: string;
  category?: string;
  spentOn?: string;
  note?: string;
}

export async function scanReceipt(
  formData: FormData
): Promise<
  | ({ success: true } & ScanResult)
  | { error: string; receiptPath?: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { error: "AI receipt scanning isn't configured yet." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to scan." };
  }
  const hint = String(formData.get("hint") ?? "").trim();

  const bytes = new Uint8Array(await file.arrayBuffer());
  const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(path, bytes, { contentType: file.type || "image/jpeg" });

  if (uploadError) return { error: uploadError.message };

  try {
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64}`;
    const categoryList = CATEGORIES.map((c) => c.value).join(", ");
    const model =
      process.env.OPENROUTER_VISION_MODEL || "openai/gpt-4o-mini";

    const prompt = `Read this receipt or screenshot of a purchase. Respond with ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "amount": number (the total amount paid),
  "currency": string (3-letter currency code, guess from symbols/context if not explicit),
  "category": string (pick the single closest match from this exact list: ${categoryList}),
  "date": string or null (the transaction date as YYYY-MM-DD if visible, else null),
  "note": string (a short description of the merchant/items, under 60 characters)
}
${hint ? `The user provided this hint about the image: "${hint}"` : ""}`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          max_tokens: 300,
        }),
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

    const result: ScanResult = { receiptPath: path };
    if (typeof parsed.amount === "number") result.amount = parsed.amount;
    if (
      typeof parsed.currency === "string" &&
      CURRENCY_CODES.includes(parsed.currency)
    ) {
      result.currency = parsed.currency;
    }
    if (
      typeof parsed.category === "string" &&
      CATEGORY_VALUES.includes(parsed.category)
    ) {
      result.category = parsed.category;
    }
    if (
      typeof parsed.date === "string" &&
      !Number.isNaN(Date.parse(parsed.date))
    ) {
      result.spentOn = parsed.date;
    }
    if (typeof parsed.note === "string") result.note = parsed.note;

    return { success: true, ...result };
  } catch {
    // The image is already uploaded and kept - just the AI read failed, so
    // the user can still fill the form in manually and it'll be attached.
    return {
      error:
        "Couldn't read the receipt automatically - fill in the details manually.",
      receiptPath: path,
    };
  }
}

export async function getReceiptUrl(
  path: string
): Promise<{ error: string } | { success: true; url: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60);

  if (error || !data) return { error: error?.message ?? "Could not load receipt." };

  return { success: true, url: data.signedUrl };
}
