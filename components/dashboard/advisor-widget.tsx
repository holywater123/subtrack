"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdvisorClient } from "@/components/dashboard/advisor-client";
import type { ChatMessage } from "@/lib/types";

export function AdvisorWidget({ messages }: { messages: ChatMessage[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(92vw,380px)]">
          <div className="mb-1 flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close advisor chat"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <AdvisorClient messages={messages} />
        </div>
      )}

      <Button
        size="icon"
        aria-label={open ? "Close advisor chat" : "Open advisor chat"}
        onClick={() => setOpen((o) => !o)}
        className="size-12 rounded-full shadow-lg"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </div>
  );
}
