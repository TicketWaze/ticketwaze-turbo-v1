"use client";
import React from "react";
import { motion } from "motion/react";
import { Order, WithdrawalRequest } from "@ticketwaze/typescript-config";

/* Pieces shared by the Finance tables and their detail panels. */

export const headClass =
  "font-sans font-bold text-[1.1rem] leading-6 text-deep-100 uppercase text-left pb-6 pr-4 whitespace-nowrap";
export const cellClass =
  "font-sans text-[1.5rem] leading-8 text-neutral-900 py-6 pr-4";

/** The grey pill with coloured caps the Figma tables use for every status. */
export function StatusPill({
  colour,
  children,
}: {
  colour: string;
  children: React.ReactNode;
}) {
  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase whitespace-nowrap"
      style={{ color: colour }}
    >
      {children}
    </motion.span>
  );
}

const CLASS_COLOURS = [
  "#EF1870",
  "#7A19C7",
  "#0D0D0D",
  "#1C7EEA",
  "#349C2E",
  "#EA961C",
];
/** A stable colour per ticket class name, so "VIP" looks the same on every row. */
export function classColour(name: string) {
  let hash = 0;
  for (const ch of name.toLowerCase())
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return CLASS_COLOURS[hash % CLASS_COLOURS.length];
}

export type OrderState = "successful" | "partly_returned" | "returned";
export function orderState(order: Order): OrderState {
  const tickets = order.tickets ?? [];
  const returned = tickets.filter((t) => t.status === "RETURNED").length;
  if (tickets.length > 0 && returned === tickets.length) return "returned";
  return returned > 0 ? "partly_returned" : "successful";
}
export const ORDER_COLOURS: Record<OrderState, string> = {
  successful: "#349C2E",
  partly_returned: "#EA961C",
  returned: "#737C8A",
};

export const WITHDRAWAL_COLOURS: Record<WithdrawalRequest["status"], string> = {
  PENDING: "#EA961C",
  APPROVED: "#1C7EEA",
  SUCCESSFUL: "#349C2E",
  FAILED: "#DE0028",
};

/** What a buyer paid for an order, in the activity's currency. */
export function orderPaid(order: Order) {
  const usd = order.activity?.currency === "USD";
  return (order.tickets ?? []).reduce(
    (sum, t) => sum + (Number(usd ? t.ticketUsdPrice : t.ticketPrice) || 0),
    0,
  );
}
