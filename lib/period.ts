export type Period = "day" | "week" | "month" | "year";

// PeriodEstimateCard's projection math (fixed/variable pacing) is only
// built for day/week/month - it deliberately keeps using this narrower
// list rather than PERIODS_WITH_YEAR, so it never renders a "Year" button
// it can't compute correctly.
export const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export const PERIODS_WITH_YEAR: { value: Period; label: string }[] = [
  ...PERIODS,
  { value: "year", label: "Year" },
];

export const AVG_DAYS_PER_MONTH = 30.44;

export function parseLocalDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Monday = 1 ... Sunday = 7
export function daysIntoWeek(date: Date) {
  const weekday = date.getDay();
  return weekday === 0 ? 7 : weekday;
}

export function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setDate(date.getDate() - (daysIntoWeek(date) - 1));
  result.setHours(0, 0, 0, 0);
  return result;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1);
}

export function isInPeriod(spentOn: string, period: Period, now: Date) {
  const date = parseLocalDate(spentOn);
  if (period === "day") return date.toDateString() === now.toDateString();
  if (period === "week") return date >= startOfWeek(now);
  if (period === "year") return date >= startOfYear(now);
  return date >= startOfMonth(now);
}

// --- Navigable period ranges (any reference date, not just "now") ---
// isInPeriod above answers "in progress, through today" for the current
// period only. These answer "within this specific period" for ANY
// period - past, current, or (trivially, always-empty) future - which is
// what letting a user pick a specific day/week/month/year needs.

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function periodStart(period: Period, date: Date): Date {
  if (period === "day") return startOfDay(date);
  if (period === "week") return startOfWeek(date);
  if (period === "year") return startOfYear(date);
  return startOfMonth(date);
}

export function periodEnd(period: Period, date: Date): Date {
  const start = periodStart(period, date);
  const end = new Date(start);
  if (period === "day") end.setDate(end.getDate() + 1);
  else if (period === "week") end.setDate(end.getDate() + 7);
  else if (period === "year") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export function isInPeriodRange(spentOn: string, period: Period, referenceDate: Date) {
  const date = parseLocalDate(spentOn);
  return date >= periodStart(period, referenceDate) && date < periodEnd(period, referenceDate);
}

export function shiftPeriod(date: Date, period: Period, direction: 1 | -1): Date {
  const result = new Date(date);
  if (period === "day") result.setDate(result.getDate() + direction);
  else if (period === "week") result.setDate(result.getDate() + 7 * direction);
  else if (period === "year") result.setFullYear(result.getFullYear() + direction);
  else result.setMonth(result.getMonth() + direction);
  return result;
}

export function isCurrentPeriod(period: Period, date: Date): boolean {
  return periodStart(period, date).getTime() === periodStart(period, new Date()).getTime();
}

export function formatPeriodLabel(period: Period, date: Date): string {
  if (period === "day") {
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (period === "week") {
    const start = startOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const startStr = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString(
      undefined,
      sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" }
    );
    return `${startStr}–${endStr}`;
  }
  if (period === "year") return String(date.getFullYear());
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
