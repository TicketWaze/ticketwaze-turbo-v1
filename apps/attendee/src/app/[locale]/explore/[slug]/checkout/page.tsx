import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import CheckoutFlow from "./CheckoutFlow";
import { Event, EventTicketType, User } from "@ticketwaze/typescript-config";
import { extractIdFromSlug } from "@/lib/Slugify";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const session = await auth();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  const ticketTypes: EventTicketType[] = eventResponse.ticketTypes;

  // The HTG/USD rate the backend will charge with. The displayed total must be
  // computed from this same value or checkout and gateway amounts diverge.
  let htgExchangeRate = 0;
  try {
    const currenciesRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/currencies`,
      { cache: "no-store" },
    );
    const currenciesResponse = await currenciesRequest.json();
    const htg = currenciesResponse?.currencies?.find(
      (c: { isoCode: string }) => c.isoCode === "HTG",
    );
    htgExchangeRate = Number(htg?.exchangeRate) || 0;
  } catch {
    htgExchangeRate = 0;
  }

  // Waitlist perk: whether this signed-in user still has their unused
  // first-purchase fee waiver. Drives the fee-free display at checkout and
  // mirrors what the API applies at payment time.
  let feeWaiverEligible = false;
  if (session?.user?.accessToken) {
    try {
      const walletRequest = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/wallet`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        },
      );
      const walletResponse = await walletRequest.json();
      feeWaiverEligible = walletResponse?.wallet?.firstPurchaseFeeWaiver === true;
    } catch {
      feeWaiverEligible = false;
    }
  }

  return (
    <AttendeeLayout title="Buy Tickets">
      <CheckoutFlow
        event={event}
        ticketTypes={ticketTypes}
        user={session?.user as User | undefined}
        feeWaiverEligible={feeWaiverEligible}
        htgExchangeRate={htgExchangeRate}
      />
    </AttendeeLayout>
  );
}
