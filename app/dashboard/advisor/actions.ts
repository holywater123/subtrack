"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildFinanceSnapshot } from "@/lib/finance-context";

type SendResult = { error: string } | { success: true; reply: string };
type ActionResult = { error: string } | { success: true };

const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";
const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_LIMIT = 12;
const REQUEST_TIMEOUT_MS = 25_000;

const SYSTEM_PROMPT_HEADER = `You are the finance assistant built into a personal finance app called Gauge. You are not a licensed financial advisor and must never claim to be one.

Rules:
- Only use the financial data provided below - never guess, estimate, or invent a number that isn't in it.
- If you don't have the data needed to answer, say so plainly instead of guessing.
- Keep answers short and easy to understand: normally 1-4 sentences, plain language, no jargon.
- Only go longer or more detailed if the user explicitly asks for more detail or a full breakdown.
- You may use **bold** (double asterisks) to emphasize a key number or name. Avoid headers, bullet lists, or other markdown unless the user explicitly asks for a structured breakdown.
- For big decisions (investing, large purchases, restructuring debt), give general, honest observations from their data and suggest they consult a licensed professional for the final call - don't present your view as definitive financial advice.`;

export async function sendChatMessage(formData: FormData): Promise<SendResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Type a message first." };
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: "Message is too long." };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { error: "The AI advisor isn't configured yet." };
  }

  const { error: insertUserError } = await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "user",
    content: message,
  });
  if (insertUserError) return { error: insertUserError.message };

  try {
    const [{ data: historyData }, snapshot] = await Promise.all([
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT),
      buildFinanceSnapshot(),
    ]);

    const history = (historyData ?? []).reverse();

    const messages = [
      {
        role: "system",
        content: `${SYSTEM_PROMPT_HEADER}\n\nUser's financial snapshot:\n${snapshot}`,
      },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

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
          messages,
          max_tokens: 400,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`OpenRouter returned ${response.status}: ${body.slice(0, 300)}`);
    }

    const data = await response.json();
    const reply: string | undefined = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("Empty response from OpenRouter");

    const { error: insertAssistantError } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, role: "assistant", content: reply });
    if (insertAssistantError) return { error: insertAssistantError.message };

    revalidatePath("/dashboard/advisor");
    return { success: true, reply };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      error: `Couldn't reach the AI advisor: ${detail}`,
    };
  }
}

export async function clearChatHistory(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/advisor");
  return { success: true };
}
