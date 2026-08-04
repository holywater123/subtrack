"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { startOfWeek, type Period } from "@/lib/period";

const WEEKDAY_HEADERS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

const cellClass = (disabled: boolean, selected: boolean, extra?: string) =>
  cn(
    "rounded-md text-sm transition-colors",
    disabled
      ? "text-muted-foreground/40 cursor-not-allowed"
      : "hover:bg-accent",
    selected && "bg-primary text-primary-foreground hover:bg-primary",
    extra
  );

// A calendar that adapts its grid to the period being picked, rather than
// forcing every period type through a day-level grid: a day grid for
// day/week (week highlights the whole row), a 12-month grid for month, a
// decade of years for year. Matches the app's existing popover/select
// surface styling (bg-popover, ring-1 ring-foreground/10) rather than a
// generic date-picker look.
export function Calendar({
  period,
  selected,
  onSelect,
  maxDate,
}: {
  period: Period;
  selected: Date;
  onSelect: (date: Date) => void;
  maxDate?: Date;
}) {
  const max = startOfDay(maxDate ?? new Date());
  const [browse, setBrowse] = useState(selected);

  if (period === "year") {
    const decadeStart = Math.floor(browse.getFullYear() / 10) * 10 - 1;
    const years = Array.from({ length: 12 }, (_, i) => decadeStart + i);

    return (
      <div className="w-56">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Previous decade"
            onClick={() => setBrowse(new Date(browse.getFullYear() - 10, 0, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium">
            {decadeStart + 1}–{decadeStart + 10}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Next decade"
            onClick={() => setBrowse(new Date(browse.getFullYear() + 10, 0, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              disabled={year > max.getFullYear()}
              onClick={() => onSelect(new Date(year, 0, 1))}
              className={cellClass(
                year > max.getFullYear(),
                year === selected.getFullYear(),
                "py-2"
              )}
            >
              {year}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (period === "month") {
    const year = browse.getFullYear();

    return (
      <div className="w-56">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Previous year"
            onClick={() => setBrowse(new Date(year - 1, 0, 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Next year"
            disabled={new Date(year + 1, 0, 1) > max}
            onClick={() => setBrowse(new Date(year + 1, 0, 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTH_LABELS.map((label, i) => {
            const disabled = new Date(year, i, 1) > max;
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(new Date(year, i, 1))}
                className={cellClass(
                  disabled,
                  year === selected.getFullYear() && i === selected.getMonth(),
                  "py-2"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // day / week share a standard month day-grid.
  const year = browse.getFullYear();
  const month = browse.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = startOfWeek(firstOfMonth);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const selectedWeekStart =
    period === "week" ? startOfWeek(selected).getTime() : null;

  return (
    <div className="w-64">
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Previous month"
          onClick={() => setBrowse(new Date(year, month - 1, 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium">
          {firstOfMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Next month"
          disabled={new Date(year, month + 1, 1) > max}
          onClick={() => setBrowse(new Date(year, month + 1, 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_HEADERS.map((d) => (
          <span key={d} className="text-muted-foreground text-[11px] font-medium">
            {d}
          </span>
        ))}
        {days.map((d) => {
          const disabled = d > max;
          const outsideMonth = d.getMonth() !== month;
          const isToday = isSameDay(d, new Date());
          const inSelectedWeek =
            period === "week" && startOfWeek(d).getTime() === selectedWeekStart;
          const isSelectedDay = period === "day" && isSameDay(d, selected);

          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d)}
              className={cn(
                cellClass(disabled, isSelectedDay, "size-8"),
                !disabled && outsideMonth && "text-muted-foreground/60",
                isToday && !isSelectedDay && "font-semibold text-primary",
                inSelectedWeek && !isSelectedDay && "bg-accent"
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
