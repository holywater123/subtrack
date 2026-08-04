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
