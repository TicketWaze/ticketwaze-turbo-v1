/** The analytics windows; mirrors the API's ANALYTICS_PERIODS. */
export const PERIODS = ["7d", "month", "30d", "year", "all"] as const;
export type Period = (typeof PERIODS)[number];
