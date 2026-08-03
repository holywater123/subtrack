"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { sendChatMessage, clearChatHistory } from "@/app/dashboard/advisor/actions";

const SUGGESTIONS = [
  "How much have I spent this month?",
  "Which subscription should I cut first?",
  "Am I on track with my budgets?",
];

function tempId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AdvisorClient({ messages }: { messages: ChatMessage[] }) {
  const [items, setItems] = useState(messages);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isClearing, startClearing] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  function submitMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    setItems((prev) => [
      ...prev,
      {
        id: tempId(),
        role: "user",
        content: trimmed,
        created_at: new Date().toISOString(),
      },
    ]);
    setInput("");

    const formData = new FormData();
    formData.set("message", trimmed);

    startTransition(async () => {
      const result = await sendChatMessage(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => [
        ...prev,
        {
          id: tempId(),
          role: "assistant",
          content: result.reply,
          created_at: new Date().toISOString(),
        },
      ]);
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    submitMessage(input);
  }

  function handleClear() {
    startClearing(async () => {
      const result = await clearChatHistory();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setItems([]);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium">Ask about your finances</h2>
          <p className="text-muted-foreground text-xs">
            Answers are grounded in your own data - not a licensed advisor.
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleClear}
            disabled={isClearing}
          >
            <Trash2 className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      <MagicCard className="flex min-h-[50vh] flex-col rounded-2xl p-4">
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="text-muted-foreground text-sm">
                Ask anything about your spending, subscriptions, debts, or
                budgets.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submitMessage(s)}
                    className="border-border text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-xs transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            items.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted text-foreground mr-auto"
                )}
              >
                {m.content}
              </div>
            ))
          )}
          {isPending && (
            <div className="bg-muted text-muted-foreground mr-auto max-w-[85%] rounded-2xl px-3.5 py-2 text-sm">
              Thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="mt-3 flex gap-2 border-t pt-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={isPending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </MagicCard>
    </div>
  );
}
