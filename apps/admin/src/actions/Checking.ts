"use server";

import { revalidatePath } from "next/cache";

/**
 * THE SCANNER, FROM THE ADMIN DASHBOARD.
 *
 * Mirrors the organisation app's scan/check-in/check-out actions, against
 * `/admin/event/...` instead of `/checking/event/...`. Both ends call the same
 * checking service in the API — see `services/ticket_checking.ts` — so an
 * admin on the door gets the same answers an organiser would.
 *
 * The access token is passed in from the caller's live `useSession()` rather
 * than read here, so it stays fresh while the scanner sits open on a phone.
 */

export interface ScannedTicket {
  ticketId: string;
  fullName: string;
  ticketName: string;
  ticketType: string;
}

/** Step 1: validate a scanned or typed ticket. Mutates nothing. */
export async function ScanTicketAction(
  eventId: string,
  ticketId: string,
  accessToken: string,
  locale: string,
) {
  try {
    if (!accessToken) {
      return {
        status: "failed" as const,
        message: "Your session has expired. Please log in again.",
      };
    }
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${eventId}/scan/${ticketId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      return {
        status: "success" as const,
        ticket: response.ticket as ScannedTicket,
        presence: response.presence as "inside" | "outside",
        availableAction: response.availableAction as "check_in" | "check_out",
        canCheckIn: Boolean(response.canCheckIn),
        checkInWindow: response.checkInWindow as "open" | "too_early" | "closed",
        opensAt: (response.opensAt ?? null) as string | null,
        totalMinutesInside: (response.totalMinutesInside ?? 0) as number,
        entriesCount: (response.entriesCount ?? 0) as number,
        currentSessionCheckedInAt: (response.currentSessionCheckedInAt ??
          null) as string | null,
      };
    }
    return {
      status: "failed" as const,
      message: response.message ?? "An unknown error occurred",
      ticket: (response.ticket ?? null) as ScannedTicket | null,
    };
  } catch (error: unknown) {
    return {
      status: "failed" as const,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/** Step 2a: open an attendance session (check the attendee in). */
export async function CheckInTicketAction(
  eventId: string,
  pathname: string,
  ticketId: string,
  accessToken: string,
  locale: string,
) {
  try {
    if (!accessToken) {
      return {
        status: "failed" as const,
        message: "Your session has expired. Please log in again.",
      };
    }
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${eventId}/check-in/${ticketId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success" as const,
        ticket: response.ticket as ScannedTicket,
      };
    } else if (response.status === "already_checked") {
      return {
        status: "already_checked" as const,
        message: response.message as string,
        ticket: response.ticket as ScannedTicket,
      };
    }
    return {
      status: "failed" as const,
      message: response.message ?? "An unknown error occurred",
    };
  } catch (error: unknown) {
    return {
      status: "failed" as const,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Step 2b: close the open attendance session (check the attendee out) and
 * surface how long they stayed.
 */
export async function CheckOutTicketAction(
  eventId: string,
  pathname: string,
  ticketId: string,
  accessToken: string,
  locale: string,
) {
  try {
    if (!accessToken) {
      return {
        status: "failed" as const,
        message: "Your session has expired. Please log in again.",
      };
    }
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${eventId}/check-out/${ticketId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ADMIN_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success" as const,
        ticket: response.ticket as ScannedTicket,
        sessionMinutes: (response.sessionMinutes ?? 0) as number,
        totalMinutesInside: (response.totalMinutesInside ?? 0) as number,
        entriesCount: (response.entriesCount ?? 0) as number,
      };
    } else if (response.status === "not_inside") {
      return {
        status: "not_inside" as const,
        message: response.message as string,
        ticket: response.ticket as ScannedTicket,
      };
    }
    return {
      status: "failed" as const,
      message: response.message ?? "An unknown error occurred",
    };
  } catch (error: unknown) {
    return {
      status: "failed" as const,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
