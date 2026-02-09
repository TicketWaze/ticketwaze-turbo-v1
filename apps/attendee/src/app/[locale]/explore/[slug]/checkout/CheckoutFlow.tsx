"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  AddCircle,
  ArrowLeft2,
  ArrowRight2,
  Card,
  InfoCircle,
  MinusCirlce,
  MoneyRecive,
  ShieldSecurity,
  Warning2,
} from "iconsax-reactjs";
import Image from "next/image";
import ticketBG from "./ticket-bg.svg";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import moncash from "./moncash.svg";
import { FreeEventTicket } from "@/actions/paymentActions";
import { useRouter } from "@/i18n/navigation";
import Slugify from "@/lib/Slugify";
import { Event, EventTicketType, User } from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import BackButton from "@/components/shared/BackButton";
import Capitalize from "@/lib/Capitalize";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { Input } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";

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
  const isFree = event.eventTicketTypes[0].ticketTypePrice == 0;

  const [currentStep, setCurrentStep] = useState(0);
  const [previousStep, setPreviousStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { control, register, watch, setValue, getValues } = useForm<any>({
    mode: "onChange",
    defaultValues: {
      tickets: ticketTypes.map((ticket) => ({
        ticketTypeId: ticket.eventTicketTypeId,
        quantity: 0,
      })),
      attendees: [], // New flat structure: [{ticketTypeId, name, email}]
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "tickets",
  });

  useEffect(() => {
    if (isFree) {
      setValue(`tickets.0.quantity`, 1, { shouldValidate: true });
      // Initialize one attendee for free tickets
      setValue("attendees", [
        { ticketTypeId: ticketTypes[0].eventTicketTypeId, name: "", email: "" },
      ]);
    }
    if (event.eventType === "meet") {
      setValue(`tickets.0.quantity`, 1, { shouldValidate: true });
      // Initialize one attendee for free tickets
      setValue("attendees", [
        {
          ticketTypeId: ticketTypes[0].eventTicketTypeId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
      ]);
    }
  }, []);

  // Watch for quantity changes and update attendees array
  const watchedTickets = watch("tickets") || [];
  const watchedAttendees = watch("attendees") || [];

  useEffect(() => {
    const currentAttendees = getValues("attendees") || [];
    const newAttendees: any[] = [];

    watchedTickets.forEach((ticket: any) => {
      if (ticket.quantity > 0) {
        // Find existing attendees for this ticket type
        const existingForType = currentAttendees.filter(
          (a: any) => a.ticketTypeId === ticket.ticketTypeId,
        );

        // Add existing or new attendees up to quantity
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

    // Only update if there's a change in length or content
    const hasChanged =
      currentAttendees.length !== newAttendees.length ||
      JSON.stringify(currentAttendees.map((a: any) => a.ticketTypeId)) !==
        JSON.stringify(newAttendees.map((a: any) => a.ticketTypeId));

    if (hasChanged) {
      setValue("attendees", newAttendees, { shouldValidate: false });
    }
  }, [
    watchedTickets.map((t: any) => `${t.ticketTypeId}-${t.quantity}`).join(","),
  ]);

  useEffect(() => {
    const currentAttendees = getValues("attendees") || [];
    const newAttendees: any[] = [];

    watchedTickets.forEach((ticket: any) => {
      if (ticket.quantity > 0) {
        // Find existing attendees for this ticket type
        const existingForType = currentAttendees.filter(
          (a: any) => a.ticketTypeId === ticket.ticketTypeId,
        );

        // Add existing or new attendees up to quantity
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

    // Only update if there's a change in length or content
    const hasChanged =
      currentAttendees.length !== newAttendees.length ||
      JSON.stringify(currentAttendees.map((a: any) => a.ticketTypeId)) !==
        JSON.stringify(newAttendees.map((a: any) => a.ticketTypeId));

    if (hasChanged) {
      setValue("attendees", newAttendees, { shouldValidate: false });
    }
  }, [
    watchedTickets.map((t: any) => `${t.ticketTypeId}-${t.quantity}`).join(","),
  ]);

  // Clear attendee fields when toggle is turned off
  useEffect(() => {
    watchedAttendees.forEach((attendee: any, index: number) => {
      if (!attendee.isForSomeoneElse) {
        setValue(`attendees.${index}.name`, "", { shouldValidate: false });
        setValue(`attendees.${index}.email`, "", { shouldValidate: false });
      }
    });
  }, [watchedAttendees.map((a: any) => a.isForSomeoneElse).join(",")]);

  const delta = currentStep - previousStep;

  const prev = () => {
    if (isFree && currentStep === 2) {
      setCurrentStep(0);
      return;
    }

    if (event.eventType === "meet" && currentStep === 2) {
      setCurrentStep(0);
      return;
    }

    if (currentStep > 0) {
      setPreviousStep(currentStep);
      setCurrentStep((step) => step - 1);
    }
  };
  const [paymentType, setPaymentType] = useState<
    "" | "moncash" | "card" | "wallet"
  >("");

  async function BuyFreeTicket() {
    setIsLoading(true);
    const values = getValues();

    // Filter out attendees who haven't filled in their info (when "someone else" is checked)
    const validAttendees = values.attendees.filter((attendee: any) => {
      return !attendee.isForSomeoneElse || (attendee.name && attendee.email);
    });

    // Send the flat attendees array: [{ticketTypeId, name, email}, ...]
    const result = await FreeEventTicket(
      user.accessToken,
      event.eventId,
      validAttendees,
      locale,
    );
    if (result.status === "success") {
      router.push(`/upcoming/${Slugify(event.eventName)}`);
    } else {
      toast.error(result.message);
    }
    setIsLoading(false);
  }

  async function MoncashPayment() {
    setIsLoading(true);
    const values = getValues();

    // Filter out attendees who haven't filled in their info (when "someone else" is checked)
    const validAttendees = values.attendees.filter((attendee: any) => {
      // If it's for someone else, they must have filled name and email
      // If not for someone else, we'll use the current user's info (handled by backend)
      return !attendee.isForSomeoneElse || (attendee.name && attendee.email);
    });

    // Send the flat attendees array: [{ticketTypeId, name, email}, ...]
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

  async function CardPayment() {
    setIsLoading(true);
    const values = getValues();

    // Filter out attendees who haven't filled in their info (when "someone else" is checked)
    const validAttendees = values.attendees.filter((attendee: any) => {
      // If it's for someone else, they must have filled name and email
      // If not for someone else, we'll use the current user's info (handled by backend)
      return !attendee.isForSomeoneElse || (attendee.name && attendee.email);
    });

    // Send the flat attendees array: [{ticketTypeId, name, email}, ...]
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
      router.push(response.redirectUrl);
    } else {
      toast.error(response.message);
    }
    setIsLoading(false);
  }

  async function WalletPayment() {
    setIsLoading(true);
    const values = getValues();
    const validAttendees = values.attendees.filter((attendee: any) => {
      return !attendee.isForSomeoneElse || (attendee.name && attendee.email);
    });
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
      router.push(`/upcoming/${Slugify(event.eventName)}`);
    } else {
      setIsLoading(false);
      toast.error(response.message);
    }
  }

  const processForm: SubmitHandler<any> = async (data) => {
    if (paymentType === "moncash") {
      await MoncashPayment();
    } else if (paymentType === "card") {
      await CardPayment();
    } else if (paymentType === "wallet") {
      await WalletPayment();
    } else {
      toast.error(t("payment.paymentType"));
    }
  };

  const next = async () => {
    const values = getValues();
    const selectedTickets = values.tickets.filter((t: any) => t.quantity > 0);
    const attendees = values.attendees || [];

    // Validate current step
    if (currentStep === 0) {
      // Step 0: Check if at least one ticket is selected
      if (selectedTickets.length === 0) {
        toast.error(t("ticket.error") || "Please select at least one ticket");
        return;
      }
    } else if (currentStep === 1) {
      // Step 1: Check if attendee info is filled for selected tickets that are for "someone else"
      const hasValidAttendees = attendees.every((attendee: any) => {
        // If the ticket is for someone else, name and email are required
        if (attendee.isForSomeoneElse) {
          return (
            attendee.name &&
            attendee.name.trim() !== "" &&
            attendee.email &&
            attendee.email.trim() !== ""
          );
        }
        // If it's not for someone else, it's valid (will use current user's info)
        return true;
      });

      if (!hasValidAttendees) {
        toast.error(t("recipient.error"));
        return;
      }
    }

    if (isFree && currentStep === 0) {
      setCurrentStep(2);
      setPreviousStep(0);
      return;
    }

    if (event.eventType === "meet" && currentStep === 0) {
      setCurrentStep(2);
      setPreviousStep(0);
      return;
    }

    if (isFree && currentStep === 2) {
      BuyFreeTicket();
      return;
    }

    setPreviousStep(currentStep);
    if (currentStep < 2) {
      setCurrentStep((s) => s + 1);
    } else {
      // Final step - submit form
      await processForm(values);
    }
  };

  const selectedWithIndex = watchedTickets
    .map((t: any, i: number) => ({ ...t, __index: i }))
    .filter((t: any) => t.quantity > 0);

  // Calculate total price
  let totalPrice = 0;
  const TAXUSD = 1.49;
  const TAXHTG = 1.49 * 131;

  if (event.currency === "USD") {
    totalPrice = selectedWithIndex.reduce((total: number, ticket: any) => {
      const ticketType = ticketTypes.find(
        (tt) => tt.eventTicketTypeId === ticket.ticketTypeId,
      );
      if (!ticketType) return total;

      const price = Number(ticketType.usdPrice);
      const fee = 0.025 * price;
      const taxedPrice = price + fee + TAXUSD;
      const totalTotal = taxedPrice * ticket.quantity;

      return total + totalTotal;
    }, 0);
  } else if (event.currency === "HTG") {
    totalPrice = selectedWithIndex.reduce((total: number, ticket: any) => {
      const ticketType = ticketTypes.find(
        (tt) => tt.eventTicketTypeId === ticket.ticketTypeId,
      );
      if (!ticketType) return total;

      const price = Number(ticketType.ticketTypePrice);
      const fee = 0.025 * price;
      const taxedPrice = price + fee + TAXHTG;
      const totalTotal = taxedPrice * ticket.quantity;

      return total + totalTotal;
    }, 0);
  }

  const router = useRouter();
  return (
    <>
      <PageLoader isLoading={isLoading} />
      <div className="relative h-full min-h-0 flex flex-col">
        {currentStep === 0 ? (
          <div className="flex flex-col gap-4">
            <BackButton text={t("back")} />
            <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
              {t("ticket.title")}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              onClick={prev}
              className={"flex max-w-[80px] cursor-pointer items-center gap-4"}
            >
              <div
                className={
                  "w-[35px] h-[35px] rounded-full bg-neutral-100 flex items-center justify-center"
                }
              >
                <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
              </div>
              <span
                className={
                  "text-neutral-700 font-normal text-[1.4rem] leading-8"
                }
              >
                {t("back")}
              </span>
            </button>
            {currentStep === 1 ? (
              <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
                {t("recipient.title")}
              </span>
            ) : (
              <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
                {t("payment.title")}
              </span>
            )}
          </div>
        )}
        <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 overflow-y-auto h-full">
          {/* Ticket Selection Step */}
          {currentStep === 0 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              layout={false}
              className="flex flex-col gap-8 overflow-y-auto min-h-0"
            >
              <ul className="flex flex-col gap-8 ">
                {fields.map((field, index) => {
                  const ticketType = ticketTypes[index];
                  const quantity = watch(`tickets.${index}.quantity`) || 0;
                  const ticketLeft =
                    ticketType.ticketTypeQuantity -
                    ticketType.ticketTypeQuantitySold;
                  return (
                    <li
                      key={field.id}
                      className="border border-neutral-100 rounded-[15px] p-[15px] flex flex-col gap-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[1.6rem] leading-10 text-deep-100">
                            {Capitalize(ticketType.ticketTypeName)}
                          </span>
                          {ticketLeft <= 100 && ticketLeft !== 0 && (
                            <span className="text-[1.2rem] text-warning">
                              {ticketLeft} {t("ticket.left")}
                            </span>
                          )}
                          {ticketLeft === 0 && (
                            <span className="text-[1.2rem] text-failure">
                              {t("ticket.soldout")}
                            </span>
                          )}
                        </div>
                        <p className="text-[1.5rem] leading-12 text-neutral-700">
                          {ticketType.ticketTypeDescription}
                        </p>
                      </div>
                      {isFree ? (
                        <span className="font-primary font-bold text-[1.8rem] leading-12 text-primary-500">
                          {t("free")}
                        </span>
                      ) : (
                        <span className="font-primary font-bold text-[1.8rem] leading-12 text-primary-500">
                          {event.currency === "USD"
                            ? ticketType.usdPrice
                            : ticketType.ticketTypePrice}{" "}
                          {event.currency}
                        </span>
                      )}
                      <div className="flex bg-neutral-100 items-center justify-between py-4 px-[1.5rem] rounded-[10px]">
                        <span className="text-[1.5rem] text-neutral-900">
                          {t("ticket.quantity")}
                        </span>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            disabled={
                              isFree ||
                              event.eventType === "meet" ||
                              getValues(`tickets.${index}.quantity`) === 0
                            }
                            className="w-[35px] h-[35px] disabled:cursor-not-allowed rounded-full bg-black flex items-center justify-center cursor-pointer"
                            onClick={() => {
                              const currentValue =
                                getValues(`tickets.${index}.quantity`) || 0;
                              const newQuantity = Math.max(0, currentValue - 1);
                              setValue(
                                `tickets.${index}.quantity`,
                                newQuantity,
                                { shouldValidate: true },
                              );
                            }}
                          >
                            <MinusCirlce
                              size="20"
                              color="#FFFFFF"
                              variant="Bulk"
                            />
                          </button>

                          <span className="text-[1.5rem] leading-12 text-neutral-900">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            disabled={
                              isFree ||
                              event.eventType === "meet" ||
                              getValues(`tickets.${index}.quantity`) ===
                                ticketLeft
                            }
                            className="w-[35px] h-[35px] disabled:cursor-not-allowed rounded-full bg-black flex items-center justify-center cursor-pointer"
                            onClick={() => {
                              const currentValue =
                                getValues(`tickets.${index}.quantity`) || 0;
                              if (currentValue < ticketLeft) {
                                const newQuantity = currentValue + 1;
                                setValue(
                                  `tickets.${index}.quantity`,
                                  newQuantity,
                                  { shouldValidate: true },
                                );
                              }
                            }}
                          >
                            <AddCircle
                              size="20"
                              color="#FFFFFF"
                              variant="Bulk"
                            />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
                <li className="hidden lg:block"></li>
                <li className="hidden lg:block"></li>
                <li className="hidden lg:block"></li>
                <li className="hidden lg:block"></li>
                <li className="hidden lg:block"></li>
              </ul>
              <div className="lg:hidden flex flex-col gap-8">
                <TicketSummaryCard
                  t={t}
                  selectedWithIndex={selectedWithIndex}
                  ticketTypes={ticketTypes}
                  totalPrice={totalPrice}
                  event={event}
                  isFree={isFree}
                  currentStep={currentStep}
                />
                <div></div>
                <div></div>
                <div></div>
              </div>
              <div className="lg:hidden"></div>
              <div className="lg:hidden"></div>
              <div className="lg:hidden"></div>
            </motion.div>
          )}

          {/* Recipient Information Step */}
          {currentStep === 1 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col gap-8 overflow-y-auto min-h-0"
            >
              <div className="flex flex-col gap-8">
                {watchedAttendees.map(
                  (attendee: any, attendeeIndex: number) => {
                    const ticketType = ticketTypes.find(
                      (tt) => tt.eventTicketTypeId === attendee?.ticketTypeId,
                    );

                    // Count which number this is for this ticket type
                    const attendeesBeforeThis = watchedAttendees.slice(
                      0,
                      attendeeIndex,
                    );
                    const sameTypeCount = attendeesBeforeThis.filter(
                      (a: any) => a.ticketTypeId === attendee?.ticketTypeId,
                    ).length;

                    return (
                      <div
                        key={`attendee-${attendeeIndex}-${attendee.ticketTypeId}`}
                        className="border border-neutral-100 rounded-[15px] flex flex-col gap-[1.5rem] p-[15px]"
                      >
                        <div className="flex items-center w-full justify-between font-semibold text-[1.6rem] leading-8 text-deep-100">
                          <span>#{sameTypeCount + 1}</span>
                          <span>
                            {ticketType
                              ? Capitalize(ticketType.ticketTypeName)
                              : "Unknown Ticket"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-4 px-[1.5rem] bg-neutral-100 rounded-[10px]">
                          <span className="text-[1.5rem] leading-12 text-neutral-900">
                            {t("recipient.someone")}
                          </span>
                          <label className="relative inline-block h-[30px] w-[50px] cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:_transparent] has-[:checked]:bg-primary-500">
                            <input
                              {...register(
                                `attendees.${attendeeIndex}.isForSomeoneElse`,
                              )}
                              className="peer sr-only"
                              id={`attendee-${attendeeIndex}`}
                              type="checkbox"
                            />
                            <ToggleIcon />
                          </label>
                        </div>
                        {watch(
                          `attendees.${attendeeIndex}.isForSomeoneElse`,
                        ) && (
                          <div className="flex flex-col gap-3">
                            <Input
                              {...register(`attendees.${attendeeIndex}.name`)}
                            >
                              {t("recipient.name")}
                            </Input>
                            <Input
                              {...register(`attendees.${attendeeIndex}.email`)}
                            >
                              {t("recipient.email")}
                            </Input>
                            <div
                              className={
                                "flex  items-start gap-4 text-[1.2rem] leading-8 text-neutral-700"
                              }
                            >
                              <Warning2 size="20" color="#DE0028" />
                              {t("recipient.warning")}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
                <div></div>
                <div className="hidden lg:block"></div>
                <div className="hidden lg:block"></div>
                <div className="hidden lg:block"></div>
                <div className="hidden lg:block"></div>
              </div>
              <div className="lg:hidden flex flex-col gap-8">
                <TicketSummaryCard
                  t={t}
                  selectedWithIndex={selectedWithIndex}
                  ticketTypes={ticketTypes}
                  totalPrice={totalPrice}
                  event={event}
                  isFree={isFree}
                />
                <div></div>
                <div></div>
                <div></div>
              </div>
              <div className="lg:hidden"></div>
              <div className="lg:hidden"></div>
              <div className="lg:hidden"></div>
            </motion.div>
          )}

          {/* Payment Step */}
          {currentStep === 2 && (
            <motion.div
              initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col gap-8 overflow-y-auto min-h-0"
            >
              <div className="flex flex-col gap-8">
                {isFree ? (
                  <div
                    className={
                      "flex flex-col items-start gap-4 p-[15px] rounded-[15px] border border-neutral-100 text-[1.5rem] leading-12 text-neutral-700"
                    }
                  >
                    <InfoCircle size="20" color="#E45B00" />
                    {t("payment.nopayment")}
                  </div>
                ) : (
                  <div className="flex flex-col gap-8">
                    {/* Wallet */}
                    <button
                      className={`flex items-center justify-between cursor-pointer p-[15px] rounded-[15px] border border-neutral-100 hover:border-primary-500 transition-all ease-in-out duration-300 ${paymentType === "wallet" && "border-2 border-primary-500"}`}
                      onClick={() => setPaymentType("wallet")}
                    >
                      <div className={"flex items-center gap-4"}>
                        <MoneyRecive size="20" color="#0d0d0d" variant="Bulk" />
                        <span
                          className={
                            "font-semibold text-[1.6rem] leading-[22px] text-deep-100"
                          }
                        >
                          {t("payment.wallet")}
                        </span>
                      </div>
                      <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
                    </button>
                    {/* MONCASH */}
                    <button
                      className={`flex items-center justify-between cursor-pointer p-[15px] rounded-[15px] border border-neutral-100 hover:border-primary-500 transition-all ease-in-out duration-300 ${paymentType === "moncash" && "border-2 border-primary-500"}`}
                      onClick={() => setPaymentType("moncash")}
                    >
                      <div className={"flex items-center gap-4"}>
                        <Image src={moncash} alt={"Logo of moncash"} />
                        <span
                          className={
                            "font-semibold text-[1.6rem] leading-[22px] text-deep-100"
                          }
                        >
                          {t("payment.moncash")}
                        </span>
                      </div>
                      <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
                    </button>
                    {/* CARD */}
                    <button
                      onClick={() => setPaymentType("card")}
                      className={`flex items-center w-full justify-between cursor-pointer p-[15px] rounded-[15px] border border-neutral-100 hover:border-primary-500 transition-all ease-in-out duration-300 ${paymentType === "card" && "border-2 border-primary-500"}`}
                    >
                      <div
                        className={"flex w-full items-center justify-between"}
                      >
                        <div className={"flex items-center gap-4"}>
                          <Card size="20" color="#0d0d0d" variant="Bulk" />
                          <span
                            className={
                              "font-semibold text-[1.6rem] leading-[22px] text-deep-100"
                            }
                          >
                            {t("payment.card")}
                          </span>
                        </div>
                        <ArrowRight2 size="20" color="#0d0d0d" variant="Bulk" />
                      </div>
                    </button>
                    <div
                      className={
                        "flex flex-col items-start gap-4 p-[15px] rounded-[15px] border border-neutral-100 text-[1.2rem] leading-8 text-neutral-700"
                      }
                    >
                      <ShieldSecurity size="20" color="#E45B00" />
                      {t("payment.secured")}
                    </div>
                  </div>
                )}
                <div></div>
                <div></div>
                <div></div>
                <div className="hidden lg:block"></div>
              </div>
              <div className="lg:hidden flex flex-col gap-8">
                <TicketSummaryCard
                  t={t}
                  selectedWithIndex={selectedWithIndex}
                  ticketTypes={ticketTypes}
                  totalPrice={totalPrice}
                  event={event}
                  isFree={isFree}
                />
                <div></div>
                <div></div>
                <div></div>
              </div>
              <div className="lg:hidden"></div>
              <div className="lg:hidden"></div>
              <div className="lg:hidden"></div>
            </motion.div>
          )}

          {/* TICKET SUMMARY VIEW */}
          <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-20 p-4 pt-0">
            <TicketSummaryCard
              t={t}
              selectedWithIndex={selectedWithIndex}
              ticketTypes={ticketTypes}
              totalPrice={totalPrice}
              event={event}
              isFree={isFree}
              currentStep={currentStep}
            />
            <div></div>
            <div></div>
          </div>
        </main>

        <div className="absolute bottom-4 py-4 px-[1.5rem] border border-neutral-100 bg-white rounded-[40px] flex items-center w-full justify-between">
          <div className="hidden lg:flex gap-4 items-center">
            <span className="text-[1.5rem] leading-12 font-medium text-primary-500">
              {t("footer.ticket")}
            </span>
            <div
              className={`w-[185px] h-[5px] ${currentStep > 0 ? "bg-primary-500" : "bg-neutral-100"} rounded-[100px]`}
            ></div>
            <span
              className={`text-[1.5rem] leading-12 ${currentStep > 0 ? "text-primary-500 font-medium" : "text-neutral-600 font-normal"}`}
            >
              {t("footer.recipient")}
            </span>
            <div
              className={`w-[185px] h-[5px] ${currentStep === 2 ? "bg-primary-500" : "bg-neutral-100"} rounded-[100px]`}
            ></div>
            <span
              className={`text-[1.5rem] leading-12 ${currentStep === 2 ? "text-primary-500 font-medium" : "text-neutral-600 font-normal"}`}
            >
              {t("footer.payment")}
            </span>
          </div>
          <div className="text-[2.2rem] lg:hidden leading-12 text-neutral-600">
            <span className="text-primary-500">{currentStep + 1}</span>/3
          </div>
          <ButtonPrimary disabled={isLoading} onClick={next}>
            {t("footer.continue")}
          </ButtonPrimary>
        </div>
      </div>
    </>
  );
}

// Helper component to reduce duplication
function TicketSummaryCard({
  t,
  selectedWithIndex,
  ticketTypes,
  totalPrice,
  event,
  isFree,
}: any) {
  const TAX = event.currency === "HTG" ? 1.49 * 131 : 1.49; // take rate from db, replace 131
  const FEE = "2.5%";
  // const price = FEE + totalPrice + TAX;
  return (
    <div className="flex flex-col gap-8 h-[500px] bg-[rgba(0,0,0,0.05)] w-full lg:h-[681px] relative shadow-[0_15px_25px_0_rgba(0,0,0,0.05)]">
      <Image src={ticketBG} alt={"ticket bg"} className="h-full" />
      <div className="absolute top-0 w-full px-4 left-[50%] -translate-x-[50%] flex flex-col items-center gap-8">
        <span className="font-primary font-medium pt-4 text-[2.2rem] leading-[30px] text-black">
          {t("ticket.summary")}
        </span>
        <div className="w-full h-[250px] lg:h-[296px] bg-neutral-100 p-[15px] text-center flex flex-col justify-between items-center">
          <div className="flex flex-col gap-8 w-full">
            <span className="font-mono text-[14px] leading-[22px] text-deep-100 text-center">
              {selectedWithIndex.length > 0
                ? t("ticket.select")
                : t("ticket.select")}
            </span>
            <div className="flex flex-col gap-4">
              {selectedWithIndex.length > 0 ? (
                selectedWithIndex.map((ticket: any) => {
                  const ticketType = ticketTypes.find(
                    (tt: any) => tt.eventTicketTypeId === ticket.ticketTypeId,
                  );
                  return (
                    <div
                      key={ticket.ticketTypeId}
                      className="w-full flex justify-between"
                    >
                      <span className="font-mono text-[1.4rem] leading-[22px] text-neutral-600">
                        x{ticket.quantity}{" "}
                        {ticketType
                          ? Capitalize(ticketType.ticketTypeName)
                          : "Unknown"}
                      </span>
                      {isFree ? (
                        <span className="font-medium text-[1.4rem] leading-[22px] text-deep-100">
                          {t("free")}
                        </span>
                      ) : (
                        <span className="font-medium text-[1.4rem] leading-[22px] text-deep-100">
                          {ticketType
                            ? (event.currency === "USD"
                                ? ticketType.usdPrice
                                : ticketType.ticketTypePrice) * ticket.quantity
                            : 0}{" "}
                          {event.currency}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex justify-center">
                  <span className="font-mono text-[1.4rem] leading-[22px] text-neutral-400">
                    No tickets selected
                  </span>
                </div>
              )}
              {!isFree && selectedWithIndex.length > 0 && (
                <div className="w-full flex justify-between">
                  <span className="font-mono text-[1.4rem] leading-[22px] text-neutral-600">
                    {t("ticket.platform")}
                  </span>
                  <span className="font-medium text-[1.4rem] leading-[22px] text-deep-100">
                    {FEE} + {TAX}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        {!ticketTypes[0].isRefundable && (
          <span className="text-warning flex gap-4 items-center">
            <Warning2 size="16" color="#ea961c" variant="TwoTone" />
            {t("ticket.ticketWarning")}
          </span>
        )}
      </div>
      <div className="absolute bottom-[7%] h-[83px] left-[50%] -translate-x-[50%] flex flex-col gap-8">
        {selectedWithIndex.length > 0 && (
          <>
            <div className="flex gap-4 justify-center flex-wrap">
              {selectedWithIndex.map((ticket: any) => {
                const ticketType = ticketTypes.find(
                  (tt: any) => tt.eventTicketTypeId === ticket.ticketTypeId,
                );
                return (
                  <span
                    key={ticket.ticketTypeId}
                    className="text-primary-500 text-[1.4rem] leading-[20px] px-[15px] py-[5px] bg-primary-50 rounded-[20px]"
                  >
                    {ticketType
                      ? Capitalize(ticketType.ticketTypeName)
                      : "Unknown"}
                  </span>
                );
              })}
            </div>
            {isFree ? (
              <span className="font-primary font-medium text-[28px] leading-[32px] text-[#000]">
                {t("free")}
              </span>
            ) : (
              <span className="font-primary font-medium text-[28px] leading-[32px] text-[#000]">
                {Number(totalPrice).toFixed(3)} {event.currency}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
