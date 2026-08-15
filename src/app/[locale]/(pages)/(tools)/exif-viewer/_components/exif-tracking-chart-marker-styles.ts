export const HISTORY_CHART_DOT_STYLE = {
  fill: "var(--background)",
  stroke: "var(--foreground)",
  strokeWidth: 2,
} as const;

export const HISTORY_CHART_ACTIVE_DOT_STYLE = {
  ...HISTORY_CHART_DOT_STYLE,
  r: 5,
  strokeWidth: 2.5,
} as const;

export const MINI_CHART_DOT_STYLE = {
  r: 2.75,
  fill: "var(--background)",
  stroke: "var(--foreground)",
  strokeWidth: 1.75,
} as const;
