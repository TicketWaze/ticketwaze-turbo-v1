"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft2 } from "iconsax-reactjs";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FreeEventTicket } from "@/actions/paymentActions";
import { useRouter } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import {
  Event,
  EventTicketType,
  PublicEventFormQuestion,
  User,
} from "@ticketwaze/typescript-config";
import { useSession } from "next-auth/react";
import PageLoader from "@/components/PageLoader";
import BackButton from "@/components/shared/BackButton";
import { ButtonPrimary } from "@/components/shared/buttons";
import { isSuspendedResponse } from "@/lib/suspension";

import {
  AttendeeFormData,
  GuestInfo,
  PaymentType,
  SeatAnswers,
  SelectedTicket,
  StepKey,
  SubmittedAnswer,
  TicketFormData,
} from "./checkout.types";
import { calculateFeeBreakdown, isFreeTicketType } from "./checkoutUtils";
import TicketSummaryCard from "./TicketSummaryCard";
import TicketSelectionStep from "./steps/TicketSelectionStep";
import RecipientStep from "./steps/RecipientStep";
import PaymentStep from "./steps/PaymentStep";
import SummaryStep from "./steps/SummaryStep";
import QuestionsStep from "./steps/QuestionsStep";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function CheckoutFlow({
  event,
  ticketTypes,
  user,
  feeWaiverEligible = false,
  htgExchangeRate = 0,
  formQuestions = [],
}: {
  event: Event;
  ticketTypes: EventTicketType[];
  user?: User;
  feeWaiverEligible?: boolean;
  htgExchangeRate?: number;
  /**
   * The organiser's checkout questions. Empty for almost every activity, which
   * is exactly when the questions step does not exist.
   */
  formQuestions?: PublicEventFormQuestion[];
}) {
  const t = useTranslations("Checkout");
  const tSuspension = useTranslations("Suspension");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  // Token comes from the live session (refreshed by next-auth), not from the
  // `user` prop captured at render — checkout can take longer than the 15-min
  // access token, which would otherwise 401 mid-payment. `user` is still used
  // for guest detection and prefilling identity.
  const accessToken = session?.user?.accessToken ?? "";

  /**
   * Turns an API failure into something worth showing. A suspension arrives as
   * a code with a developer-facing English message attached, so it has to be
   * translated here rather than passed through — every other failure already
   * carries copy the API localized.
   */
  function failureMessage(response: unknown, fallback?: string) {
    if (isSuspendedResponse(response)) return tSuspension("blocked_action");
    return (
      (response as { message?: string })?.message ??
      fallback ??
      tSuspension("generic_error")
    );
  }

  /**
   * EVERY tier on this activity is free.
   *
   * This is the activity-wide question, and it is the one that decides the
   * opening state: an all-free activity preselects its single ticket, exactly
   * as it always has. What it no longer decides is which checkout the buyer
   * gets — on a Pro activity that mixes free and paid tiers this is false while
   * the buyer may still be claiming a free ticket. `selectionIsFree` below is
   * what answers that, and it depends on what they picked.
   */
  const eventIsAllFree = event.isFree;
  const isGuest = !user;
  // Online activities are `eventCategory === "meet"`. This used to test
  // `eventType`, which only ever holds public/private, so every check below was
  // dead and online events were run through the full in-person checkout.
  const isMeet = event.eventCategory === "meet";
  // Mirrors the API's `isGoogleMeetEvent`: online, and not hosted by Zoom.
  // Online events created before Zoom existed carry no provider and are Google.
  const isGoogleMeet = isMeet && event.onlineProvider !== "zoom";
  const [currentStep, setCurrentStep] = useState(0);
  const [previousStep, setPreviousStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("");
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: "",
    lastName: "",
    email: "",
  });
  /**
   * One entry per seat, in the same order as `attendees`.
   *
   * Held here rather than in the form because a text answer would otherwise
   * re-render the whole ticket selection on every keystroke, and because the
   * shape (a map keyed by question id) is not something react-hook-form's field
   * arrays express well.
   */
  const [seatAnswers, setSeatAnswers] = useState<SeatAnswers[]>([]);

  const idempotencyKey = useRef(crypto.randomUUID());

  // Private activities cannot be purchased as a guest — send guests back to the event
  // page to sign in with their invited email. (The API enforces this too.)
  useEffect(() => {
    if (isGuest && event.isPrivate) {
      toast.error(t("private_login_required"));
      router.push(`/explore/${slugify(event.eventName, event.eventId)}`);
    }
  }, [isGuest, event, router, t]);

  // Online activities cannot be purchased as a guest at all — a calendar invite
  // and a call to join need an account to attach to. (The API enforces this too.)
  useEffect(() => {
    if (isGuest && isMeet) {
      toast.error(t("online_login_required"));
      router.push(`/explore/${slugify(event.eventName, event.eventId)}`);
    }
  }, [isGuest, isMeet, event, router, t]);

  /*
   * A Google Meet event needs a Google identity on the invite, so the buyer
   * must hold a Gmail address.
   *
   * Said here rather than at the pay button: being refused after choosing
   * tickets and filling in attendee details wastes work the buyer cannot
   * salvage. Sent back to the event page because the fix is signing in with a
   * different account, which is where that happens. The API refuses it too.
   */
  useEffect(() => {
    if (isGuest || !isGoogleMeet) return;
    const email = user?.email ?? "";
    if (!email) return;
    const domain = email.trim().toLowerCase().split("@").pop();
    if (domain === "gmail.com" || domain === "googlemail.com") return;
    toast.error(t("google_mail_required"));
    router.push(`/explore/${slugify(event.eventName, event.eventId)}`);
  }, [isGuest, isGoogleMeet, user, event, router, t]);

  const { control, register, watch, setValue, getValues } = useForm<{
    tickets: TicketFormData[];
    attendees: AttendeeFormData[];
  }>({
    mode: "onChange",
    defaultValues: {
      tickets: ticketTypes.map((ticket) => ({
        ticketTypeId: ticket.eventTicketTypeId,
        quantity: 0,
      })),
      attendees: [],
    },
  });

  const { fields } = useFieldArray({ control, name: "tickets" });

  useEffect(() => {
    // Keyed off the ACTIVITY, not the selection — at mount nothing is selected
    // yet. An all-free activity and an online one each hand out exactly one
    // seat, so that seat is chosen for the buyer.
    if (eventIsAllFree || isMeet) {
      setValue("tickets.0.quantity", 1, { shouldValidate: true });
      setValue("attendees", [
        {
          ticketTypeId: ticketTypes[0].eventTicketTypeId,
          name: isMeet && user ? `${user.firstName} ${user.lastName}` : "",
          email: isMeet && user ? user.email : "",
          isForSomeoneElse: false,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedTickets = watch("tickets") || [];
  const watchedAttendees = (watch("attendees") || []) as AttendeeFormData[];

  // Sync attendees array when ticket quantities change
  useEffect(() => {
    const currentAttendees = getValues("attendees") || [];
    const newAttendees: AttendeeFormData[] = [];

    watchedTickets.forEach((ticket) => {
      if (ticket.quantity > 0) {
        const existingForType = currentAttendees.filter(
          (a: AttendeeFormData) => a.ticketTypeId === ticket.ticketTypeId,
        );
        for (let i = 0; i < ticket.quantity; i++) {
          if (existingForType[i]) {
            newAttendees.push(existingForType[i]);
          } else {
            newAttendees.push({
              ticketTypeId: ticket.ticketTypeId,
              name: "",
              email: "",
              isForSomeoneElse: false,
            });
          }
        }
      }
    });

    const hasChanged =
      currentAttendees.length !== newAttendees.length ||
      JSON.stringify(
        currentAttendees.map((a: AttendeeFormData) => a.ticketTypeId),
      ) !== JSON.stringify(newAttendees.map((a) => a.ticketTypeId));

    if (hasChanged) {
      setValue("attendees", newAttendees, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTickets.map((t) => `${t.ticketTypeId}-${t.quantity}`).join(",")]);

  // Clear attendee fields when "for someone else" toggle is turned off
  useEffect(() => {
    watchedAttendees.forEach((attendee, index) => {
      if (!attendee.isForSomeoneElse) {
        setValue(`attendees.${index}.name`, "", { shouldValidate: false });
        setValue(`attendees.${index}.email`, "", { shouldValidate: false });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAttendees.map((a) => a.isForSomeoneElse).join(",")]);

  const delta = currentStep - previousStep;

  const goToStep = (step: number) => {
    setPreviousStep(currentStep);
    setCurrentStep(step);
  };

  const selectedWithIndex: SelectedTicket[] = watchedTickets
    .map((t, i) => ({ ...t, __index: i }))
    .filter((t) => t.quantity > 0);

  /**
   * WHICH CHECKOUT THIS ORDER GETS — decided by what is in the cart.
   *
   * A cart is all-free or all-paid, never both. Mixing them would mean a
   * zero-value line item at Stripe (which refuses amounts under its minimum) or
   * a zero-gourde MonCash/NatCash transaction, and it would let the free tier's
   * one-per-person rule be sidestepped by hiding a free seat behind a paid one.
   * The API refuses a mixed cart on every payment route; `selectionIsMixed`
   * exists so the buyer is told at selection time instead of at the pay button.
   */
  const selectedTicketTypes = selectedWithIndex
    .map((selected) =>
      ticketTypes.find((tt) => tt.eventTicketTypeId === selected.ticketTypeId),
    )
    .filter((tt): tt is EventTicketType => Boolean(tt));
  const hasSelection = selectedTicketTypes.length > 0;
  const selectionIsFree =
    hasSelection && selectedTicketTypes.every(isFreeTicketType);
  const selectionIsMixed =
    hasSelection &&
    selectedTicketTypes.some(isFreeTicketType) &&
    !selectedTicketTypes.every(isFreeTicketType);

  /**
   * A Google Meet seat is one seat, for the account that will receive the
   * calendar invite — so the recipient step is skipped for online activities as
   * well as for a free claim. The PAYMENT step is a separate question: an
   * online activity can still be paid, and must not be routed to the free flow.
   */
  const skipsRecipientStep = selectionIsFree || isMeet;

  /**
   * WHICH STEPS THIS CHECKOUT HAS, in order.
   *
   * Built from the cart and the activity rather than hard-coded, so every
   * navigation below can ask for a step BY NAME and none of them has to know
   * what number it landed on. The four conditions, each for its own reason:
   *
   *   recipient — skipped for a free claim (one seat, the buyer's own) and for
   *               an online activity (one seat, and it must be the account
   *               holder's).
   *   questions — only when the organiser actually asked something. This is the
   *               new one, and it sits BEFORE payment so nobody is asked for
   *               information after their money has gone.
   *   payment   — nothing to pay on a free claim.
   *
   * `tickets` and `summary` always exist, so the list is never empty.
   */
  const hasQuestions = formQuestions.length > 0;
  const steps: StepKey[] = useMemo(() => {
    const list: StepKey[] = ["tickets"];
    if (!skipsRecipientStep) list.push("recipient");
    if (hasQuestions) list.push("questions");
    if (!selectionIsFree) list.push("payment");
    list.push("summary");
    return list;
  }, [skipsRecipientStep, hasQuestions, selectionIsFree]);

  /**
   * The step being shown. Clamped rather than indexed raw: changing the cart on
   * the first screen can shorten the list (a paid cart becoming free drops the
   * payment step), and a stale index would otherwise render nothing at all.
   */
  const step: StepKey =
    steps[Math.min(currentStep, steps.length - 1)] ?? "tickets";

  /** Display name per ticket type, for the per-seat cards in the questions step. */
  const ticketTypeNames = useMemo(
    () =>
      Object.fromEntries(
        ticketTypes.map((type) => [
          type.eventTicketTypeId,
          type.ticketTypeName,
        ]),
      ),
    [ticketTypes],
  );

  /**
   * Answers are dropped whenever the number of seats changes.
   *
   * They are held by POSITION, and changing the cart renumbers the positions —
   * keeping them would quietly move one attendee's answers onto another seat,
   * which is worse than asking again.
   */
  useEffect(() => {
    setSeatAnswers((previous) =>
      previous.length === watchedAttendees.length
        ? previous
        : watchedAttendees.map(() => ({})),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedAttendees.length]);

  function setAnswer(
    seatIndex: number,
    questionId: string,
    value: { answer: string; isOther: boolean },
  ) {
    setSeatAnswers((previous) => {
      const next = [...previous];
      while (next.length <= seatIndex) next.push({});
      next[seatIndex] = { ...next[seatIndex], [questionId]: value };
      return next;
    });
  }

  /**
   * The answers for one seat, in the shape the API takes. Blank answers are
   * dropped so an untouched optional question is absent rather than empty —
   * the API treats those as the same thing, and sending nothing is clearer.
   */
  function answersForSeat(seatIndex: number): SubmittedAnswer[] {
    const seat = seatAnswers[seatIndex] ?? {};
    return Object.entries(seat)
      .filter(([, value]) => value.answer.trim().length > 0)
      .map(([questionId, value]) => ({
        questionId,
        answer: value.answer.trim(),
        isOther: value.isOther,
      }));
  }

  /**
   * The first unanswered required question, as a message. Null when the form is
   * complete. The API enforces this too — this is so the buyer is told before
   * a payment sheet opens rather than after.
   */
  function firstMissingAnswer(): string | null {
    for (let seat = 0; seat < watchedAttendees.length; seat += 1) {
      for (const question of formQuestions) {
        if (!question.isRequired) continue;
        const value = seatAnswers[seat]?.[question.eventFormQuestionId];
        if (!value || value.answer.trim().length === 0) {
          return watchedAttendees.length > 1
            ? t("questions.missing_for_seat", {
                number: seat + 1,
                question: question.label,
              })
            : t("questions.missing", { question: question.label });
        }
      }
    }
    return null;
  }

  // The fee waiver only applies to paid orders (free tickets carry no fees).
  const feeWaived = feeWaiverEligible && !selectionIsFree;
  const feeBreakdown = calculateFeeBreakdown(
    selectedWithIndex,
    ticketTypes,
    event.currency,
    paymentType,
    feeWaived,
    htgExchangeRate,
    event.absorbFees === true,
  );

  // --- Payment actions ---

  async function BuyFreeTicket() {
    setIsLoading(true);
    const values = getValues();
    const validAttendees = keepCompleteAttendees(
      attendeesWithAnswers(values.attendees),
    );
    const result = await FreeEventTicket(
      accessToken,
      event.eventId,
      validAttendees,
      locale,
    );
    if (result.status === "success") {
      router.push(`/upcoming/${slugify(event.eventName, event.eventId)}`);
    } else {
      toast.error(failureMessage(result));
    }
    setIsLoading(false);
  }

  /**
   * The attendee list with each seat's answers attached.
   *
   * ATTACHED BEFORE ANY FILTERING, and that ordering is the whole point.
   * `seatAnswers` is held by position, and the paid paths below drop incomplete
   * "for someone else" rows before posting — pairing answers to attendees after
   * that filter would shift every answer onto the wrong seat. Doing it here
   * means the pair travels together through whatever happens next.
   */
  function attendeesWithAnswers(attendees: AttendeeFormData[]) {
    return attendees.map((attendee, index) => ({
      ...attendee,
      answers: answersForSeat(index),
    }));
  }

  /** The same rule every paid path applies, kept in one place. */
  function keepCompleteAttendees<T extends AttendeeFormData>(attendees: T[]) {
    return attendees.filter((a) => !a.isForSomeoneElse || (a.name && a.email));
  }

  function buildGuestTickets(attendees: AttendeeFormData[]) {
    return attendeesWithAnswers(attendees).map((a) => ({
      ticketTypeId: a.ticketTypeId,
      name:
        a.isForSomeoneElse && a.name
          ? a.name
          : `${guestInfo.firstName} ${guestInfo.lastName}`,
      email: a.isForSomeoneElse && a.email ? a.email : guestInfo.email,
      answers: a.answers,
    }));
  }

  // MonCash and NatCash are the same flow — create the order, then hand the payer
  // to the wallet's own hosted page — so they share one function and differ only
  // in the endpoint segment.
  async function WalletGatewayPayment(provider: "moncash" | "natcash") {
    setIsLoading(true);
    const values = getValues();

    if (isGuest) {
      const tickets = buildGuestTickets(values.attendees);
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/guest/events/${event.eventId}/payments/${provider}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotencyKey.current,
          },
          body: JSON.stringify({ guest: guestInfo, tickets }),
        },
      );
      const response = await request.json();
      if (response.status === "success" && response.paymentURL) {
        router.push(response.paymentURL);
      } else {
        toast.error(failureMessage(response, "Something went wrong"));
      }
      setIsLoading(false);
      return;
    }

    const validAttendees = keepCompleteAttendees(
      attendeesWithAnswers(values.attendees),
    );
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/payments/${provider}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify(validAttendees),
      },
    );
    const response = await request.json();
    if (response.status === "success" && response.paymentURL) {
      router.push(response.paymentURL);
    } else {
      toast.error(failureMessage(response, "Something went wrong"));
    }
    setIsLoading(false);
  }

  async function StripePayment() {
    setIsLoading(true);
    const values = getValues();

    if (isGuest) {
      const tickets = buildGuestTickets(values.attendees);
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/guest/events/${event.eventId}/payments/stripe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guest: guestInfo, tickets }),
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        setStripeClientSecret(response.clientSecret);
        setStripeDialogOpen(true);
      } else {
        toast.error(failureMessage(response));
      }
      setIsLoading(false);
      return;
    }

    const validAttendees = keepCompleteAttendees(
      attendeesWithAnswers(values.attendees),
    );
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/payments/stripe`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validAttendees),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      setStripeClientSecret(response.clientSecret);
      setStripeDialogOpen(true);
    } else {
      toast.error(failureMessage(response));
    }
    setIsLoading(false);
  }

  async function WalletPayment() {
    setIsLoading(true);
    const values = getValues();
    const validAttendees = keepCompleteAttendees(
      attendeesWithAnswers(values.attendees),
    );
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/payments/wallet`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify(validAttendees),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      router.push(`/upcoming/${slugify(event.eventName, event.eventId)}`);
    } else {
      toast.error(failureMessage(response));
    }
    setIsLoading(false);
  }

  // --- Navigation ---

  /**
   * One line, because the list no longer contains steps that are not there.
   * This used to need a special case per skipped step — each one written twice,
   * forwards and backwards — and every new conditional step would have added
   * another pair.
   */
  const prev = () => {
    if (currentStep === 0) return;
    goToStep(currentStep - 1);
  };

  const handleNext = async () => {
    const values = getValues();
    const selectedTickets = values.tickets.filter(
      (t: TicketFormData) => t.quantity > 0,
    );

    if (step === "tickets") {
      if (selectedTickets.length === 0) {
        toast.error(t("ticket.error"));
        return;
      }
      // Free and paid tickets are separate orders — see `selectionIsMixed`.
      // Said here so the buyer can fix it while still on the selection screen.
      if (selectionIsMixed) {
        toast.error(t("ticket.mixed_error"));
        return;
      }
      // A free ticket has to be attached to an account: the free-claim route
      // needs authentication, and there is no guest path to it.
      if (isGuest && selectionIsFree) {
        toast.error(t("ticket.free_login_required"));
        router.push(`/auth/login`);
        return;
      }
      if (isGuest && skipsRecipientStep) {
        router.push(`/auth/login`);
        return;
      }
      // Whatever comes next in THIS checkout's list — which already excludes
      // the recipient step for online and free carts, and the payment step for
      // free ones.
      goToStep(1);
      return;
    }

    if (step === "recipient") {
      if (isGuest) {
        if (
          !guestInfo.firstName.trim() ||
          !guestInfo.lastName.trim() ||
          !guestInfo.email.trim()
        ) {
          toast.error(t("recipient.guest_info_required"));
          return;
        }
        setIsLoading(true);
        const checkRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/guest/check-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: guestInfo.email }),
          },
        );
        const checkData = await checkRes.json();
        setIsLoading(false);
        // Order matters: a suspended account is also an existing account, and
        // sending it to the login page would only produce a second refusal.
        if (checkData.isSuspended) {
          toast.error(tSuspension("blocked_action"), { duration: 10000 });
          return;
        }
        if (checkData.hasAccount) {
          toast.error(t("recipient.account_exists"));
          router.push(`/auth/login`);
          return;
        }
      }

      const attendees = values.attendees as AttendeeFormData[];
      const hasValidAttendees = attendees.every((a) => {
        if (a.isForSomeoneElse) return a.name?.trim() && a.email?.trim();
        return true;
      });
      if (!hasValidAttendees) {
        toast.error(t("recipient.error"));
        return;
      }
      goToStep(currentStep + 1);
      return;
    }

    if (step === "questions") {
      // Required answers are checked here so the buyer can fix them while still
      // on the form. The API refuses the same thing at payment time — this is
      // the explanation, not the enforcement.
      const missing = firstMissingAnswer();
      if (missing) {
        toast.error(missing);
        return;
      }
      goToStep(currentStep + 1);
      return;
    }

    if (step === "payment") {
      if (!paymentType) {
        toast.error(t("payment.paymentType"));
        return;
      }
      goToStep(currentStep + 1);
      return;
    }

    if (step === "summary") {
      // Refused here rather than at the API, so a suspended buyer is told why
      // before a payment sheet opens rather than after. The API refuses it too
      // — this is the explanation, not the enforcement.
      if (session?.user?.isSuspended) {
        toast.error(tSuspension("blocked_action"), { duration: 10000 });
        return;
      }
      // Keyed off the CART's prices, not the activity's flag: on an activity
      // that mixes tiers a free-only cart is claimed, a paid cart is charged.
      if (selectionIsFree) {
        await BuyFreeTicket();
      } else if (paymentType === "moncash" || paymentType === "natcash") {
        await WalletGatewayPayment(paymentType);
      } else if (paymentType === "card") {
        await StripePayment();
      } else if (paymentType === "wallet") {
        await WalletPayment();
      }
    }
  };

  const stepTitles: Record<StepKey, string> = {
    tickets: t("ticket.title"),
    recipient: t("recipient.title"),
    questions: t("questions.title"),
    payment: t("payment.title"),
    summary: t("summary.title"),
  };
  const stepTitle = stepTitles[step];

  const footerButtonText =
    step === "summary"
      ? selectionIsFree
        ? t("summary.confirm_free")
        : t("summary.confirm")
      : t("footer.continue");

  const isFooterButtonDisabled =
    isLoading || (step === "payment" && !paymentType);

  const shortStepLabels: Record<StepKey, string> = {
    tickets: t("footer.ticket"),
    recipient: t("footer.recipient"),
    questions: t("footer.questions"),
    payment: t("footer.payment"),
    summary: t("footer.summary"),
  };
  // Only the steps this checkout actually has, so the progress bar never
  // promises one the buyer will never see.
  const stepLabels = steps.map((key) => shortStepLabels[key]);

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <div className="h-full min-h-0 flex flex-col">
        {/* Header */}
        {step === "tickets" ? (
          <div className="shrink-0 flex flex-col gap-4">
            <BackButton text={t("back")} />
            <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
              {t("ticket.title")}
            </span>
          </div>
        ) : (
          <div className="shrink-0 flex flex-col gap-4">
            <button
              onClick={prev}
              className="flex max-w-32 cursor-pointer items-center gap-4"
            >
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
              </div>
              <span className="text-neutral-700 font-normal text-[1.4rem] leading-8">
                {t("back")}
              </span>
            </button>
            <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
              {stepTitle}
            </span>
          </div>
        )}

        <main className="flex-1 min-h-0 w-full flex flex-col overflow-y-auto pb-4 lg:pb-0 lg:overflow-hidden lg:grid lg:grid-cols-[29fr_23fr] lg:grid-rows-1 gap-8">
          {step === "tickets" && (
            <TicketSelectionStep
              delta={delta}
              fields={fields}
              watchedTickets={watchedTickets}
              ticketTypes={ticketTypes}
              event={event}
              eventIsAllFree={eventIsAllFree}
              selectedWithIndex={selectedWithIndex}
              feeBreakdown={feeBreakdown}
              paymentType={paymentType}
               
              setValue={
                setValue as (name: string, value: any, options?: object) => void
              }
            />
          )}

          {step === "recipient" && (
            <RecipientStep
              delta={delta}
              watchedAttendees={watchedAttendees}
              ticketTypes={ticketTypes}
              event={event}
              isFree={selectionIsFree}
              isGuest={isGuest}
              guestInfo={guestInfo}
              onGuestInfoChange={setGuestInfo}
              selectedWithIndex={selectedWithIndex}
              feeBreakdown={feeBreakdown}
              paymentType={paymentType}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              register={register as (name: string, options?: object) => any}
              control={control}
            />
          )}

          {step === "questions" && (
            <QuestionsStep
              delta={delta}
              questions={formQuestions}
              watchedAttendees={watchedAttendees}
              ticketTypeNames={ticketTypeNames}
              answers={seatAnswers}
              onAnswerChange={setAnswer}
              event={event}
              ticketTypes={ticketTypes}
              isFree={selectionIsFree}
              selectedWithIndex={selectedWithIndex}
              feeBreakdown={feeBreakdown}
              paymentType={paymentType}
            />
          )}

          {step === "payment" && (
            <PaymentStep
              delta={delta}
              isFree={selectionIsFree}
              isGuest={isGuest}
              paymentType={paymentType}
              onSelectPayment={setPaymentType}
              selectedWithIndex={selectedWithIndex}
              ticketTypes={ticketTypes}
              event={event}
              feeBreakdown={feeBreakdown}
            />
          )}

          {step === "summary" && (
            <SummaryStep
              delta={delta}
              event={event}
              isFree={selectionIsFree}
              ticketTypes={ticketTypes}
              selectedWithIndex={selectedWithIndex}
              paymentType={paymentType}
              feeBreakdown={feeBreakdown}
            />
          )}

          {/* Desktop sidebar — always visible */}
          <div className="hidden lg:flex lg:flex-col overflow-y-auto min-h-0 p-4 pt-0">
            <TicketSummaryCard
              selectedWithIndex={selectedWithIndex}
              ticketTypes={ticketTypes}
              event={event}
              isFree={selectionIsFree}
              feeBreakdown={feeBreakdown}
              paymentType={paymentType}
            />
          </div>
        </main>

        {/* Footer */}
        <div className="shrink-0 mt-3 py-4 px-6 border border-neutral-100 bg-white rounded-[40px] flex items-center w-full justify-between mb-4">
          {/* Desktop step progress */}
          <div className="hidden lg:flex gap-3 items-center">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className={`text-[1.5rem] leading-12 ${
                    currentStep >= i
                      ? "text-primary-500 font-medium"
                      : "text-neutral-600 font-normal"
                  }`}
                >
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`w-48 h-2 rounded-[100px] ${
                      currentStep > i ? "bg-primary-500" : "bg-neutral-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Mobile step counter */}
          <div className="text-[2.2rem] lg:hidden leading-12 text-neutral-600">
            <span className="text-primary-500">
              {Math.min(currentStep, steps.length - 1) + 1}
            </span>
            /{steps.length}
          </div>

          <ButtonPrimary disabled={isFooterButtonDisabled} onClick={handleNext}>
            {footerButtonText}
          </ButtonPrimary>
        </div>
      </div>

      <Dialog open={stripeDialogOpen} onOpenChange={setStripeDialogOpen}>
        <DialogContent className="max-w-240 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("payment.card")}</DialogTitle>
          </DialogHeader>
          {stripeClientSecret && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret: stripeClientSecret }}
            >
              <EmbeddedCheckout className="w-full" />
            </EmbeddedCheckoutProvider>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
