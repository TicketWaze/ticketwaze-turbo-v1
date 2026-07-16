/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { slugify } from "@/lib/Slugify";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";

/*
  ====================GOOGLE MEET===================
*/
export async function CreateGoogleMeetEvent(
  organisationId: string,
  accessToken: string,
  body: FormData,
  locale: string,
  code: string | undefined,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/meet/${organisationId}?code=${code}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath("/events");
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function UpdateGoogleMeetEvent(
  organisationId: string,
  accessToken: string,
  body: FormData,
  locale: string,
  eventId: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/meet/${organisationId}/${eventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath(
        `/events/show/${slugify(response.event.eventName, response.event.eventId)}`,
      );
      return {
        status: "success",
        event: response.event,
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

/*
  ====================IN PERSON===================
*/
export async function ValidateBasicDetailsInPerson(
  organisationId: string,
  accessToken: string,
  body: FormData,
  locale: string,
  requestType: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/validation/in-person/basic-details/${organisationId}/${requestType}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      return {
        status: "success",
      };
    } else {
      throw new Error(response.error.messages[0].message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function CreateInPersonEvent(
  organisationId: string,
  accessToken: string,
  body: FormData,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/in-person/${organisationId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function CreateRaffle(
  organisationId: string,
  accessToken: string,
  body: FormData,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${organisationId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      return { status: "success" };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function UpdateRaffle(
  organisationId: string,
  raffleId: string,
  accessToken: string,
  body: FormData,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${organisationId}/${raffleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      return { status: "success" };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function RequestRaffleDeletion(
  organisationId: string,
  raffleId: string,
  accessToken: string,
  locale: string,
  reason: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${organisationId}/${raffleId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify({ reason }),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      return {
        scheduledDeletionAt: response.scheduledDeletionAt as string,
        delayDays: response.delayDays as number,
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function CancelRaffleDeletion(
  organisationId: string,
  raffleId: string,
  accessToken: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${organisationId}/${raffleId}/deletion`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      return { status: "success" };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function UpdateInPersonEvent(
  organisationId: string,
  accessToken: string,
  body: FormData,
  locale: string,
  eventId: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/in-person/${organisationId}/${eventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath(
        `/events/show/${slugify(response.event.eventName, response.event.eventId)}`,
      );
      return {
        status: "success",
        event: response.event,
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

/*
  ====================PRIVATE===================
*/
export async function CreatePrivateEvent(
  organisationId: string,
  accessToken: string,
  body: FormData,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/private/${organisationId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath("/events");
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function UpdatePrivateEvent(
  organisationId: string,
  accessToken: string,
  body: FormData,
  locale: string,
  eventId: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/private/${organisationId}/${eventId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath(
        `/events/show/${slugify(response.event.eventName, response.event.eventId)}`,
      );
      return {
        status: "success",
        event: response.event,
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function UpdateTicketTypes(
  organisationId: string,
  eventId: string,
  accessToken: string,
  data: unknown,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/in-person/${organisationId}/${eventId}/ticket-types`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_APP_UR!,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function CreateDiscountCode(
  eventId: string,
  accessToken: string,
  data: unknown,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/discount-code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function AddAttendee(
  eventId: string,
  accessToken: string,
  data: unknown,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/attendees`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify(data),
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function RemoveAttendeeAccess(
  eventId: string,
  eventAttendeeId: string,
  accessToken: string,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/attendees/${eventAttendeeId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function MarkDiscountCodeAsInactive(
  eventId: string,
  discountCodeId: string,
  accessToken: string,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/discount-code/${discountCodeId}/mark-as-inactive`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function MarkDiscountCodeAsActive(
  eventId: string,
  discountCodeId: string,
  accessToken: string,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/discount-code/${discountCodeId}/mark-as-active`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function UpdateCheckersListAction(
  eventId: string,
  accessToken: string,
  pathname: string,
  body: unknown,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/checkers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_APP_UR!,
        },
        body: JSON.stringify(body),
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function MarkAsActive(
  eventId: string,
  accessToken: string,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/mark-as-active`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function DeleteEvent(
  eventId: string,
  accessToken: string,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}
export async function RequestEventDeletion(
  eventId: string,
  accessToken: string,
  locale: string,
  reason: string,
  pathname: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: JSON.stringify({ reason }),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success" as const,
        scheduledDeletionAt: response.scheduledDeletionAt as string,
        delayDays: response.delayDays as number,
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return { error: error?.message ?? "An unknown error occurred" };
  }
}

export async function CancelEventDeletion(
  eventId: string,
  accessToken: string,
  locale: string,
  pathname: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/deletion`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      revalidatePath(pathname);
      return { status: "success" as const };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return { error: error?.message ?? "An unknown error occurred" };
  }
}

export async function MarkAsInactive(
  eventId: string,
  accessToken: string,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/mark-as-inactive`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function CheckInWithTicketID(
  eventId: string,
  pathname: string,
  ticketID: string,
  locale: string,
) {
  try {
    // Read the token from the session at call time, not from a prop captured at
    // page render: the scanner stays open longer than the 15-min access token, so
    // a render-time token would 401 mid-session. auth() refreshes it if needed.
    const session = await auth();
    const accessToken = session?.user.accessToken;
    if (!accessToken) {
      return {
        status: "failed" as const,
        message: "Your session has expired. Please log in again.",
      };
    }
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/ticket-id/${ticketID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return { status: "success" as const, ticket: response.ticket };
    } else if (response.status === "already_checked") {
      return { status: "already_checked" as const, ticket: response.ticket };
    } else {
      return {
        status: "failed" as const,
        message: response.message ?? "An unknown error occurred",
      };
    }
  } catch (error: any) {
    return {
      status: "failed" as const,
      message: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function CheckInWithQrCode(
  eventId: string,
  pathname: string,
  ticketID: string,
  locale: string,
) {
  try {
    // Read the token from the session at call time, not from a prop captured at
    // page render: the scanner stays open longer than the 15-min access token, so
    // a render-time token would 401 mid-session. auth() refreshes it if needed.
    const session = await auth();
    const accessToken = session?.user.accessToken;
    if (!accessToken) {
      return {
        status: "failed" as const,
        message: "Your session has expired. Please log in again.",
      };
    }
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/checking/event/${eventId}/qr/${ticketID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return { status: "success" as const, ticket: response.ticket };
    } else if (response.status === "already_checked") {
      return { status: "already_checked" as const, ticket: response.ticket };
    } else {
      return {
        status: "failed" as const,
        message: response.message ?? "An unknown error occurred",
      };
    }
  } catch (error: any) {
    return {
      status: "failed" as const,
      message: error?.message ?? "An unknown error occurred",
    };
  }
}

type ScannedTicket = {
  ticketId: string;
  fullName: string;
  ticketName: string;
  ticketType: string;
};

/*
  ====================SCANNER (TWO-STEP CHECK-IN / CHECK-OUT)===================
  Step 1: scan/validate a ticket without mutating it. Tells the checker which
  action (check-in or check-out) is available next.
*/
export async function ScanTicketAction(
  eventId: string,
  accessToken: string,
  ticketId: string,
  locale: string,
) {
  try {
    // Token comes from the client's live useSession() so it stays fresh while
    // the scanner is open, and avoids the rotating-refresh-token pitfall of
    // calling auth() inside a server action.
    if (!accessToken) {
      return {
        status: "failed" as const,
        message: "Your session has expired. Please log in again.",
      };
    }
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/checking/event/${eventId}/scan/${ticketId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
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
  } catch (error: any) {
    return {
      status: "failed" as const,
      message: error?.message ?? "An unknown error occurred",
    };
  }
}

/*
  Step 2a: open an attendance session (check the attendee in).
*/
export async function CheckInTicketAction(
  eventId: string,
  accessToken: string,
  pathname: string,
  ticketId: string,
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
      `${process.env.NEXT_PUBLIC_API_URL}/checking/event/${eventId}/check-in/${ticketId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
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
        message: response.message,
        ticket: response.ticket as ScannedTicket,
      };
    }
    return {
      status: "failed" as const,
      message: response.message ?? "An unknown error occurred",
    };
  } catch (error: any) {
    return {
      status: "failed" as const,
      message: error?.message ?? "An unknown error occurred",
    };
  }
}

/*
  Step 2b: close the open attendance session (check the attendee out) and
  surface how long they stayed.
*/
export async function CheckOutTicketAction(
  eventId: string,
  accessToken: string,
  pathname: string,
  ticketId: string,
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
      `${process.env.NEXT_PUBLIC_API_URL}/checking/event/${eventId}/check-out/${ticketId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
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
        message: response.message,
        ticket: response.ticket as ScannedTicket,
      };
    }
    return {
      status: "failed" as const,
      message: response.message ?? "An unknown error occurred",
    };
  } catch (error: any) {
    return {
      status: "failed" as const,
      message: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function AddArtist(
  eventId: string,
  accessToken: string,
  pathname: string,
  body: FormData,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/artist`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        body: body,
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}

export async function RemoveArtist(
  eventId: string,
  eventPerformerId: string,
  accessToken: string,
  pathname: string,
  locale: string,
) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/artist/${eventPerformerId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "success") {
      revalidatePath(pathname);
      return {
        status: "success",
      };
    } else {
      throw new Error(response.message);
    }
  } catch (error: any) {
    return {
      error: error?.message ?? "An unknown error occurred",
    };
  }
}
