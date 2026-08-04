"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_MUTED_TEXT,
  CHART_SEQUENTIAL,
} from "@/lib/chart-colors";

export interface TrendBar {
  key: string;
  label: string;
  amount: number;
  tooltipLabel: string;
}

function niceCeiling(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const niceNormalized =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

function formatTick(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toString();
}

// A single sequential hue bar chart, generic over whatever bucket a caller
// wants (days, months, ...) - trend-over-time is a magnitude job, not
// identity, so one hue throughout regardless of bucket count.
export function TrendBarChart({
  data,
  symbol,
  sparseLabels = false,
}: {
  data: TrendBar[];
  symbol: string;
  sparseLabels?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard client-hydration-detection idiom, no derivable alternative
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  const [hovered, setHovered] = useState<number | null>(null);

  const barColor = isDark ? CHART_SEQUENTIAL.dark : CHART_SEQUENTIAL.light;
  const gridColor = isDark ? CHART_GRID.dark : CHART_GRID.light;
  const axisColor = isDark ? CHART_AXIS.dark : CHART_AXIS.light;

  if (data.length === 0) return null;

  const width = 600;
  const height = 160;
  const paddingLeft = 34;
  const paddingRight = 8;
  const paddingTop = 8;
  const paddingBottom = 20;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const maxAmount = Math.max(...data.map((d) => d.amount));
  const niceMax = niceCeiling(maxAmount);
  const yTicks = [0, niceMax / 2, niceMax];
  const barWidth = plotWidth / data.length;

  const labeledIndexes = sparseLabels
    ? new Set(
        data
          .map((_, i) => i)
          .filter((i) => i === 0 || i === data.length - 1 || i % 5 === 0)
      )
    : new Set(data.map((_, i) => i));

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Spending trend, peak ${symbol}${maxAmount.toFixed(2)}`}
      >
        {yTicks.map((tick) => {
          const y = paddingTop + plotHeight - (tick / niceMax) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={y}
                y2={y}
                stroke={gridColor}
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 6}
                y={y + 3}
                textAnchor="end"
                fontSize={9}
                fill={CHART_MUTED_TEXT}
              >
                {formatTick(tick)}
              </text>
            </g>
          );
        })}

        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={paddingTop + plotHeight}
          y2={paddingTop + plotHeight}
          stroke={axisColor}
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const barH = niceMax > 0 ? (d.amount / niceMax) * plotHeight : 0;
          const x = paddingLeft + i * barWidth;
          const y = paddingTop + plotHeight - barH;
          const isHovered = hovered === i;
          return (
            <rect
              key={d.key}
              x={x + barWidth * 0.15}
              y={y}
              width={Math.max(1, barWidth * 0.7)}
              height={Math.max(0, barH)}
              rx={2}
              fill={barColor}
              opacity={isHovered ? 1 : 0.85}
              tabIndex={0}
              onPointerEnter={() => setHovered(i)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
            >
              <title>{`${d.tooltipLabel}: ${symbol}${d.amount.toFixed(2)}`}</title>
            </rect>
          );
        })}

        {data.map((d, i) => {
          if (!labeledIndexes.has(i)) return null;
          const x = paddingLeft + i * barWidth + barWidth / 2;
          return (
            <text
              key={d.key}
              x={x}
              y={height - 4}
              textAnchor="middle"
              fontSize={9}
              fill={CHART_MUTED_TEXT}
            >
              {d.label}
            </text>
          );
        })}
      </svg>

      <p className="text-muted-foreground mt-1 text-center text-xs">
        {hovered !== null ? (
          <>
            {data[hovered].tooltipLabel}:{" "}
            <span className="text-foreground font-medium">
              {symbol}
              {data[hovered].amount.toFixed(2)}
            </span>
          </>
        ) : (
          "Hover a bar for the exact amount"
        )}
      </p>
    </div>
  );
}
