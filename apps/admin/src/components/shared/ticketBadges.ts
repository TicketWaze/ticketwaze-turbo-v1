/** Figma's class badge colours (General pink, VIP purple, Premium dark). */
export function ticketClassColor(ticketType: string) {
  const upper = ticketType.toUpperCase();
  if (upper.includes("PREMIUM")) return "#2E3237";
  if (upper.includes("VIP")) return "#7A19C7";
  return "#EF1870";
}

export type CheckStatus = "PENDING" | "CHECKED" | "RETURNED";

/** Check-in status badge classes (Figma: pending amber, checked-in green). */
export const CHECK_BADGE: Record<CheckStatus, string> = {
  CHECKED: "bg-success/10 text-success",
  PENDING: "bg-warning/15 text-[#C98A00]",
  RETURNED: "bg-neutral-100 text-neutral-700",
};
