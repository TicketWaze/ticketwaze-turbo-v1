import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import CheckoutFlow from "./CheckoutFlow";
import {
  Event,
  EventTicketType,
  PublicEventFormQuestion,
  User,
} from "@ticketwaze/typescript-config";
import { extractIdFromSlug } from "@/lib/Slugify";
import { notFound } from "next/navigation";

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
  const eventResponse = await eventRequest.json().catch(() => null);

  /**
   * The API OMITS `event` rather than sending a null one when the event is
   * unavailable — deleted, cancelled, not yet approved, or its organisation
   * suspended. Without this guard the undefined flows into `CheckoutFlow`,
   * which reads `event.isFree` on its first line and takes the whole page down
   * with "Cannot read properties of undefined".
   *
   * `notFound()` rather than an error view: an event scheduled for deletion is
   * genuinely not there, and this matches the raffle checkout beside it.
   */
  if (!eventRequest.ok || !eventResponse?.event) notFound();

  const event: Event = eventResponse.event;
  const ticketTypes: EventTicketType[] = eventResponse.ticketTypes ?? [];

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

  /**
   * The organiser's checkout questions, if this activity has any.
   *
   * Its own request rather than a field on the event: the questions are needed
   * on exactly one screen, and folding them into the event payload would put
   * them in every cached listing that never asks for them.
   *
   * PUBLIC, because guest checkout carries no token. A failure here yields an
   * empty list rather than an error page — a checkout must not be blocked by an
   * optional step, and the API re-checks every required answer at payment time
   * regardless, so nothing can be skipped by a request that quietly failed.
   */
  let formQuestions: PublicEventFormQuestion[] = [];
  try {
    const questionsRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${eventId}/form-questions`,
      { cache: "no-store" },
    );
    const questionsResponse = await questionsRequest.json();
    formQuestions = (questionsResponse?.questions ??
      []) as PublicEventFormQuestion[];
  } catch {
    formQuestions = [];
  }

  return (
    <AttendeeLayout title="Buy Tickets">
      <CheckoutFlow
        event={event}
        ticketTypes={ticketTypes}
        user={session?.user as User | undefined}
        feeWaiverEligible={feeWaiverEligible}
        htgExchangeRate={htgExchangeRate}
        formQuestions={formQuestions}
      />
    </AttendeeLayout>
  );
}
