export type Granularity = "day" | "month";

/** yyyy-MM-dd or yyyy-MM, read as a local calendar date. */
export function keyToDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d ?? 1);
}

/**
 * Figma's x-axis: the day of the month ("05") for day buckets, the short
 * month for month buckets, and "Now" on the current bucket.
 */
export function axisLabels(
  points: { key: string; isNow: boolean }[],
  granularity: Granularity,
  locale: string,
  nowLabel: string,
) {
  const month = new Intl.DateTimeFormat(locale, { month: "short" });
  return points.map((p) =>
    p.isNow
      ? nowLabel
      : granularity === "day"
        ? p.key.slice(8)
        : month.format(keyToDate(p.key)),
  );
}
