"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatPeriodLabel,
  isCurrentPeriod,
  shiftPeriod,
  type Period,
} from "@/lib/period";

// Prev/label/next row for navigating to a specific past occurrence of a
// period - not just "the current one." Standalone so callers that already
// pick the period type another way (e.g. a Select alongside other filters)
// can still get date navigation without the tabs below.
export function PeriodNav({
  period,
  referenceDate,
  onReferenceDateChange,
}: {
  period: Period;
  referenceDate: Date;
  onReferenceDateChange: (date: Date) => void;
}) {
  const atCurrent = isCurrentPeriod(period, referenceDate);

  return (
    <div className="flex items-center gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Previous"
        onClick={() => onReferenceDateChange(shiftPeriod(referenceDate, period, -1))}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-[8ch] text-center text-xs font-medium">
        {formatPeriodLabel(period, referenceDate)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Next"
        disabled={atCurrent}
        onClick={() => onReferenceDateChange(shiftPeriod(referenceDate, period, 1))}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

// Period-type tabs (Day/Week/Month/Year, whichever subset the caller
// passes) plus the PeriodNav row - switching the period type resets to
// today's occurrence of it, since e.g. "the month containing whatever
// week I'd navigated to" isn't a well-defined jump.
export function PeriodPicker({
  period,
  referenceDate,
  onPeriodChange,
  onReferenceDateChange,
  periods,
}: {
  period: Period;
  referenceDate: Date;
  onPeriodChange: (period: Period) => void;
  onReferenceDateChange: (date: Date) => void;
  periods: { value: Period; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="bg-muted flex gap-0.5 rounded-full p-0.5">
        {periods.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant="ghost"
            onClick={() => {
              onPeriodChange(p.value);
              onReferenceDateChange(new Date());
            }}
            className={cn(
              "h-7 rounded-full px-3 text-xs",
              period === p.value && "bg-background shadow-sm hover:bg-background"
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <PeriodNav
        period={period}
        referenceDate={referenceDate}
        onReferenceDateChange={onReferenceDateChange}
      />
    </div>
  );
}
