// Validated via the dataviz skill's six-checks validator
// (scripts/validate_palette.js) - fixed slot order, never cycled or
// regenerated. See references/palette.md in that skill for the full report.

export interface ChartColor {
  light: string;
  dark: string;
}

export const CHART_CATEGORICAL: ChartColor[] = [
  { light: "#2a78d6", dark: "#3987e5" }, // 1 blue
  { light: "#eb6834", dark: "#d95926" }, // 2 orange
  { light: "#1baf7a", dark: "#199e70" }, // 3 aqua
  { light: "#eda100", dark: "#c98500" }, // 4 yellow
  { light: "#e87ba4", dark: "#d55181" }, // 5 magenta
  { light: "#008300", dark: "#008300" }, // 6 green
];

// De-emphasis / "Other" bucket - never a categorical slot.
export const CHART_OTHER: ChartColor = { light: "#c3c2b7", dark: "#52514e" };

// Single hue for magnitude/trend (sequential job).
export const CHART_SEQUENTIAL: ChartColor = { light: "#2a78d6", dark: "#3987e5" };

// Chart chrome (axes, gridlines, muted labels) - fixed regardless of theme.
export const CHART_GRID: ChartColor = { light: "#e1e0d9", dark: "#2c2c2a" };
export const CHART_AXIS: ChartColor = { light: "#c3c2b7", dark: "#383835" };
export const CHART_MUTED_TEXT = "#898781";

// Soft cap before folding the tail into "Other" (series-count ladder).
export const CHART_MAX_SLOTS = CHART_CATEGORICAL.length;
