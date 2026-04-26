"use client";
import { useEffect, useState } from "react";
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
import { Event, EventTicketType, User } from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import BackButton from "@/components/shared/BackButton";
import { ButtonPrimary } from "@/components/shared/buttons";

import {
  AttendeeFormData,
  PaymentType,
  SelectedTicket,
  TicketFormData,
} from "./checkout.types";
import { calculateFeeBreakdown } from "./checkoutUtils";
import TicketSummaryCard from "./TicketSummaryCard";
import TicketSelectionStep from "./steps/TicketSelectionStep";
import RecipientStep from "./steps/RecipientStep";
import PaymentStep from "./steps/PaymentStep";
import SummaryStep from "./steps/SummaryStep";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function CheckoutFlow({
  event,
  ticketTypes,
  user,
}: {
  event: Event;
  ticketTypes: EventTicketType[];
  user: User;
}) {
  const t = useTranslations("Checkout");
  const locale = useLocale();
  const router = useRouter();
  const isFree = event.isFree;

  const [currentStep, setCurrentStep] = useState(0);
  const [previousStep, setPreviousStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>("");
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null,
  );
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);

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
    if (isFree || event.eventType === "meet") {
      setValue("tickets.0.quantity", 1, { shouldValidate: true });
      setValue("attendees", [
        {
          ticketTypeId: ticketTypes[0].eventTicketTypeId,
          name:
            event.eventType === "meet"
              ? `${user.firstName} ${user.lastName}`
              : "",
          email: event.eventType === "meet" ? user.email : "",
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

  const feeBreakdown = calculateFeeBreakdown(
    selectedWithIndex,
    ticketTypes,
    event.currency,
    paymentType,
  );

  // --- Payment actions ---

  async function BuyFreeTicket() {
    setIsLoading(true);
    const values = getValues();
    const validAttendees = values.attendees.filter(
      (a: AttendeeFormData) => !a.isForSomeoneElse || (a.name && a.email),
    );
    const result = await FreeEventTicket(
      user.accessToken,
      event.eventId,
      validAttendees,
      locale,
    );
    if (result.status === "success") {
      router.push(`/upcoming/${slugify(event.eventName, event.eventId)}`);
    } else {
      toast.error(result.message);
    }
    setIsLoading(false);
  }

  async function MoncashPayment() {
    setIsLoading(true);
    const values = getValues();
    const validAttendees = values.attendees.filter(
      (a: AttendeeFormData) => !a.isForSomeoneElse || (a.name && a.email),
    );
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/payments/moncash`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validAttendees),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      router.push(response.paymentURL);
    } else {
      toast.error(response.message);
    }
    setIsLoading(false);
  }

  async function StripePayment() {
    setIsLoading(true);
    const values = getValues();
    const validAttendees = values.attendees.filter(
      (a: AttendeeFormData) => !a.isForSomeoneElse || (a.name && a.email),
    );
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/payments/stripe`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
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
      toast.error(response.message);
    }
    setIsLoading(false);
  }

  async function WalletPayment() {
    setIsLoading(true);
    const values = getValues();
    const validAttendees = values.attendees.filter(
      (a: AttendeeFormData) => !a.isForSomeoneElse || (a.name && a.email),
    );
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/events/${event.eventId}/payments/wallet`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validAttendees),
      },
    );
    const response = await request.json();
    if (response.status === "success") {
      router.push(`/upcoming/${slugify(event.eventName, event.eventId)}`);
    } else {
      toast.error(response.message);
    }
    setIsLoading(false);
  }

  // --- Navigation ---

  const prev = () => {
    if (currentStep === 0) return;
    if ((isFree || event.eventType === "meet") && currentStep === 3) {
      goToStep(0);
      return;
    }
    goToStep(currentStep - 1);
  };

  const handleNext = async () => {
    const values = getValues();
    const selectedTickets = values.tickets.filter(
      (t: TicketFormData) => t.quantity > 0,
    );

    if (currentStep === 0) {
      if (selectedTickets.length === 0) {
        toast.error(t("ticket.error"));
        return;
      }
      goToStep(isFree || event.eventType === "meet" ? 3 : 1);
      return;
    }

    if (currentStep === 1) {
      const attendees = values.attendees as AttendeeFormData[];
      const hasValidAttendees = attendees.every((a) => {
        if (a.isForSomeoneElse) return a.name?.trim() && a.email?.trim();
        return true;
      });
      if (!hasValidAttendees) {
        toast.error(t("recipient.error"));
        return;
      }
      goToStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!paymentType) {
        toast.error(t("payment.paymentType"));
        return;
      }
      goToStep(3);
      return;
    }

    if (currentStep === 3) {
      if (isFree || event.eventType === "meet") {
        await BuyFreeTicket();
      } else if (paymentType === "moncash") {
        await MoncashPayment();
      } else if (paymentType === "card") {
        await StripePayment();
      } else if (paymentType === "wallet") {
        await WalletPayment();
      }
    }
  };

  const stepTitle = [
    t("ticket.title"),
    t("recipient.title"),
    t("payment.title"),
    t("summary.title"),
  ][currentStep];

  const footerButtonText =
    currentStep === 3
      ? isFree
        ? t("summary.confirm_free")
        : t("summary.confirm")
      : t("footer.continue");

  const isFooterButtonDisabled =
    isLoading || (currentStep === 2 && !isFree && !paymentType);

  const stepLabels = [
    t("footer.ticket"),
    t("footer.recipient"),
    t("footer.payment"),
    t("footer.summary"),
  ];

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <div className="h-full min-h-0 flex flex-col">
        {/* Header */}
        {currentStep === 0 ? (
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
              className="flex max-w-[80px] cursor-pointer items-center gap-4"
            >
              <div className="w-[35px] h-[35px] rounded-full bg-neutral-100 flex items-center justify-center">
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
          {currentStep === 0 && (
            <TicketSelectionStep
              delta={delta}
              fields={fields}
              watchedTickets={watchedTickets}
              ticketTypes={ticketTypes}
              event={event}
              isFree={isFree}
              selectedWithIndex={selectedWithIndex}
              feeBreakdown={feeBreakdown}
              paymentType={paymentType}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setValue={setValue as (name: string, value: any, options?: object) => void}
            />
          )}

          {currentStep === 1 && (
            <RecipientStep
              delta={delta}
              watchedAttendees={watchedAttendees}
              ticketTypes={ticketTypes}
              event={event}
              isFree={isFree}
              selectedWithIndex={selectedWithIndex}
              feeBreakdown={feeBreakdown}
              paymentType={paymentType}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              register={register as (name: string, options?: object) => any}
            />
          )}

          {currentStep === 2 && (
            <PaymentStep
              delta={delta}
              isFree={isFree}
              paymentType={paymentType}
              onSelectPayment={setPaymentType}
              selectedWithIndex={selectedWithIndex}
              ticketTypes={ticketTypes}
              event={event}
              feeBreakdown={feeBreakdown}
            />
          )}

          {currentStep === 3 && (
            <SummaryStep
              delta={delta}
              event={event}
              isFree={isFree}
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
              isFree={isFree}
              feeBreakdown={feeBreakdown}
              paymentType={paymentType}
            />
          </div>
        </main>

        {/* Footer */}
        <div className="shrink-0 mt-3 py-4 px-[1.5rem] border border-neutral-100 bg-white rounded-[40px] flex items-center w-full justify-between">
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
                    className={`w-[120px] h-[5px] rounded-[100px] ${
                      currentStep > i ? "bg-primary-500" : "bg-neutral-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Mobile step counter */}
          <div className="text-[2.2rem] lg:hidden leading-12 text-neutral-600">
            <span className="text-primary-500">{currentStep + 1}</span>/4
          </div>

          <ButtonPrimary disabled={isFooterButtonDisabled} onClick={handleNext}>
            {footerButtonText}
          </ButtonPrimary>
        </div>
      </div>

      <Dialog open={stripeDialogOpen} onOpenChange={setStripeDialogOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("payment.card")}</DialogTitle>
          </DialogHeader>
          {stripeClientSecret && (
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret: stripeClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
