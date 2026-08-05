"use client";

import { useState } from "react";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickEntryClient } from "@/components/dashboard/quick-entry-client";

// Structural twin of AdvisorWidget - opposite corner (left, not right) so
// the two floating buttons never overlap.
export function QuickEntryWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-3">
      {open && (
        <div className="w-[min(92vw,380px)]">
          <div className="mb-1 flex justify-start">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close quick entry"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <QuickEntryClient onDone={() => setOpen(false)} />
        </div>
      )}

      <Button
        size="icon"
        aria-label={open ? "Close quick entry" : "Open quick entry"}
        onClick={() => setOpen((o) => !o)}
        className="size-12 rounded-full shadow-lg"
      >
        {open ? <X className="size-5" /> : <Zap className="size-5" />}
      </Button>
    </div>
  );
}
