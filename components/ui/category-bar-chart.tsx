"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { CHART_CATEGORICAL, CHART_MAX_SLOTS, CHART_OTHER } from "@/lib/chart-colors";

export interface CategoryBarChartRow {
  label: string;
  amount: number;
  pct: number;
}

interface Segment extends CategoryBarChartRow {
  color: string;
}

// Part-to-whole rides on a stacked bar, not a donut (donut stays
// deprioritized - bar segments are far easier to compare by eye than pie
// slice angles). Categories beyond the soft cap fold into "Other" in the
// de-emphasis color rather than generating more hues.
export function CategoryBarChart({
  rows,
  symbol,
}: {
  rows: CategoryBarChartRow[];
  symbol: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-hydration-detection idiom, no derivable alternative
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  if (rows.length === 0) return null;

  const visible = rows.slice(0, CHART_MAX_SLOTS);
  const tail = rows.slice(CHART_MAX_SLOTS);
  const otherAmount = tail.reduce((sum, r) => sum + r.amount, 0);
  const otherPct = tail.reduce((sum, r) => sum + r.pct, 0);

  const segments: Segment[] = visible.map((row, i) => ({
    ...row,
    color: isDark ? CHART_CATEGORICAL[i].dark : CHART_CATEGORICAL[i].light,
  }));
  if (otherAmount > 0) {
    segments.push({
      label: "Other",
      amount: otherAmount,
      pct: otherPct,
      color: isDark ? CHART_OTHER.dark : CHART_OTHER.light,
    });
  }

  return (
    <div>
      <div
        className="flex h-6 w-full overflow-hidden rounded-md"
        role="img"
        aria-label={`Category breakdown: ${segments.map((s) => `${s.label} ${s.pct.toFixed(0)}%`).join(", ")}`}
      >
        {segments.map((seg, i) => (
          <div
            key={seg.label}
            tabIndex={0}
            title={`${seg.label}: ${symbol}${seg.amount.toFixed(2)} (${seg.pct.toFixed(0)}%)`}
            className="h-full transition-opacity outline-none hover:opacity-80 focus-visible:opacity-80"
            style={{
              width: `${Math.max(seg.pct, 0.5)}%`,
              backgroundColor: seg.color,
              marginRight: i < segments.length - 1 ? 2 : 0,
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: seg.color }}
              aria-hidden="true"
            />
            <span className="text-foreground">{seg.label}</span>
            <span className="text-muted-foreground">{seg.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
