// Live support is staffed 9 AM – 5 PM Haiti time; outside that window the
// chat UI shows an "away" status and messages are answered when we're back.
export const SUPPORT_TIMEZONE = "America/Port-au-Prince";
export const SUPPORT_OPEN_HOUR = 9;
export const SUPPORT_CLOSE_HOUR = 17;

export function isSupportOnline(): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: SUPPORT_TIMEZONE,
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  return hour >= SUPPORT_OPEN_HOUR && hour < SUPPORT_CLOSE_HOUR;
}
