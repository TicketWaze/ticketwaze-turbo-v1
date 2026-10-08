"use client";
import { Event, Ticket } from "@ticketwaze/typescript-config";
import TicketDetailsDrawer from "@/components/shared/TicketDetailsDrawer";

/**
 * The activity page's Ticket Details: the shared drawer, fed from the event
 * and its orders that the page already holds.
 */
export default function Informations({ ticket, event }: { ticket: Ticket; event: Event }) {
  const order = event.orders?.find((o) => o.orderId === ticket.orderId);
  const firstDay = event.eventDays?.find((day) => day.dayNumber === 1) ?? event.eventDays?.[0];
  const firstCheckIn = (ticket as Ticket & { checkIns?: { checkedInAt: string }[] }).checkIns?.[0];
  return (
    <TicketDetailsDrawer
      ticket={{
        ticketId: ticket.ticketId,
        ticketName: ticket.ticketName,
        ticketType: ticket.ticketType,
        fullName: ticket.fullName,
        email: ticket.email,
        status: ticket.status,
        price: { htg: Number(ticket.ticketPrice), usd: Number(ticket.ticketUsdPrice) },
        isGiveaway: Boolean(ticket.isGiveaway),
        source: ticket.source ?? "purchase",
        checkedInAt: firstCheckIn?.checkedInAt ?? null,
        activity: {
          name: event.eventName,
          currency: event.currency,
          date: firstDay ? String(firstDay.eventDate).slice(0, 10) : null,
          startTime: firstDay?.startTime ?? null,
          endTime: firstDay?.endTime ?? null,
          location:
            event.eventCategory === "meet"
              ? "Google Meet"
              : [event.address, event.city, event.state, event.country].filter(Boolean).join(", "),
        },
        order: order
          ? {
              orderName: order.orderName,
              provider: order.provider,
              paidAt: order.createdAt as unknown as string,
              status: order.status,
            }
          : null,
      }}
    />
  );
}
