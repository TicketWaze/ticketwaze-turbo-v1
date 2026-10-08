import type { Period } from "../../analytics/periods";

/**
 * The start of one of the analytics windows, in the browser's time (the
 * ticket history filters a list already on the page). null for all time.
 */
export function analyticsStart(period: Period, now = new Date()): Date | null {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case "7d":
      return new Date(day.getTime() - 6 * 86_400_000);
    case "30d":
      return new Date(day.getTime() - 29 * 86_400_000);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}
