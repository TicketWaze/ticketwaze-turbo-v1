"use client";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
// import { auth } from "@/lib/auth";
import Image from "next/image";
import { motion } from "framer-motion";
import Rema from "@ticketwaze/ui/assets/images/rema.png";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { Link } from "@/i18n/navigation";
import { Event, Ticket } from "@ticketwaze/typescript-config";
import More from "@ticketwaze/ui/assets/icons/more-circle.svg";
import { Star1 } from "iconsax-reactjs";
import TicketViewer from "./TicketViewer";
import BackButton from "@/components/shared/BackButton";
import FeedbackSuccessDialog from "./FeedbackSuccessDialog";
import { ButtonBlack, ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { TextArea } from "@/components/shared/Inputs";
import { useTranslations } from "next-intl";
import { DateTime } from "luxon";
import React, { useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import RatingDialog from "./RatingDialog";
import Separator from "@/components/shared/Separator";

export default function HistoryEventPage() {
  const t = useTranslations("History.activity");

  //fictif
  const organisationName = "Cap-Haïtien Music Alliance";
  const eventName = "Cap-Haïtien Jazz Festival";
  const isVerified = true;
  const isLoading = false;
  const organisationId = 1;

  const mockTickets: Ticket[] = [
    {
      ticketId: "TKT-2026-XYZ001",
      ticketName: "VIP PASS - FRONT ROW",
      ticketType: "VIP",
      eventId: "EVT-001",
      orderId: "ORD-999",
      userId: "USR-123",
      fullName: "Rema Starboy",
      email: "rema@mavinrecords.com",
      ticketPrice: 7500, // HTG
      ticketUsdPrice: 50, // USD
      organisationId: "ORG-001",
      isRefundable: false,
      status: "PENDING",
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    },
    {
      ticketId: "TKT-2026-XYZ002",
      ticketName: "STANDARD ACCESS",
      ticketType: "REGULAR",
      eventId: "EVT-001",
      orderId: "ORD-999",
      userId: "USR-456",
      fullName: "Don Jazzy",
      email: "don@mavin.com",
      ticketPrice: 3000,
      ticketUsdPrice: 20,
      organisationId: "ORG-001",
      isRefundable: true,
      status: "CHECKED",
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    },
  ];

  const mockEvent: Event = {
    eventId: "EVT-001",
    organisationId: "ORG-001",
    eventName: "Afrobeats Summer Tour",
    eventDescription: "The biggest afrobeats concert in the Caribbean.",
    address: "Stade Sylvio Cator, Port-au-Prince",
    state: "Ouest",
    city: "Port-au-Prince",
    country: "Haiti",
    location: { lat: 18.5392, lng: -72.3353 },
    eventImageUrl: "https://example.com/poster.jpg",
    eventType: "Concert",
    eventCategory: "Music", // Si tu mets "meet", le bouton download se grise
    adminStatus: "approved",
    isActive: true,
    isFree: false,
    currency: "USD",
    activityTags: ["Music", "Dance", "Summer"],

    // Important pour ton TicketViewer (filtre sur dayNumber === 1)
    eventDays: [
      {
        eventDayId: "DAY-001",
        eventId: "EVT-001",
        organisationId: "ORG-001",
        dayNumber: 1,
        eventDate: "2026-07-20T20:00:00Z", // String ISO pour FormatDate
        startTime: "2026-07-20T18:00:00Z", // String ISO pour formatTime
        endTime: "2026-07-21T02:00:00Z", // String ISO pour formatTime
        timezone: "America/Port-au-Prince",
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
    ],

    // Important pour ton TicketViewer (Warning de remboursement)
    eventTicketTypes: [
      {
        eventTicketTypeId: "ETT-001",
        eventId: "EVT-001",
        organisationId: "ORG-001",
        ticketTypeName: "VIP",
        ticketTypeDescription: "Front row access",
        ticketTypePrice: 7500,
        currency: "HTG",
        usdPrice: 50,
        ticketTypeQuantity: 100,
        ticketTypeQuantitySold: 20,
        isRefundable: false, // Déclenche le texte "ticketWarning2"
      },
    ],

    eventTagId: "TAG-001",
    googleMeetLink: "",
    googleCalendarEventId: "",
    discountCodes: [],
    eventPerformers: [],
    eventAttendees: [],
    createdAt: DateTime.now().toISO()!,
    updatedAt: DateTime.now().toISO()!,
  };

  // pour le modal
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [feedback, setFeedback] = useState("");
  const [comment, setComment] = useState("");
  // let feedback = false;

  const onSubmit = async (e: React.FormEvent) => {
    // feedback = true;
    e.preventDefault();
    setFeedback(comment);
    // logique d'envoi API.....
    setShowSuccess(true);
  };
  //

  //pour le rting
  const [showRating, setShowRating] = React.useState(false);
  const [rating, setRating] = useState(0);
  const handleRatingComplete = (rating: number) => {
    console.log("Note enregistrée :", rating);
    setShowRating(false);
    setRating(rating);
  };
  //

  return (
    <AttendeeLayout title="History Page">
      <BackButton text={t("back")} />
      <div className="grid grid-cols-1 lg:grid-cols-[29fr_23fr] w-full ">
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {eventName}
        </span>
        <div className={"flex items-center justify-between w-full"}>
          <div className={"flex items-center gap-4 lg:px-5"}>
            <span className="shrink-0 w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
              {organisationName.slice()[0]?.toUpperCase()}
            </span>

            <div className={"flex flex-col"}>
              <span
                className={
                  "font-normal text-[1.4rem] lg:text-[1.6rem] leading-8 text-deep-200"
                }
              >
                {organisationName}
              </span>
            </div>
          </div>
          <Link
            href={`/organisations/${organisationId}`}
            className="border-2 py-[7.5px] px-6 lg:px-12 rounded-[100px] border-black font-semibold text-[1.5rem] whitespace-nowrap"
          >
            {t("viewProfile")}
          </Link>
        </div>
      </div>
      <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 overflow-y-auto h-full">
        {/* Left column content */}
        <div className="flex flex-col gap-8 lg:overflow-y-auto min-h-0">
          <div className="w-full max-h-[29.8rem] overflow-hidden rounded-[10px] shrink-0">
            <Image
              src={Rema}
              width={580}
              height={298}
              alt={eventName}
              className="w-full"
            />
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {Array.from({ length: rating }).map((_, index) => (
                <Star1
                  key={`stared-${index}`}
                  size="25"
                  color="#E45B00"
                  variant="Bulk"
                />
              ))}

              {Array.from({ length: 5 - rating }).map((_, index) => (
                <Star1
                  key={`empty-${index}`}
                  size="25"
                  color="#ABB0B9"
                  variant="Bulk"
                />
              ))}
            </div>
            <div className="flex gap-4 items-center">
              {rating === 0 && (
                <Dialog open={showRating} onOpenChange={setShowRating}>
                  <DialogTrigger asChild>
                    <ButtonBlack
                      onClick={() => setShowRating(true)}
                      className="py-3 leading-normal -tracking-[0.75px] text-[1.5rem] font-semibold"
                    >
                      {t("rate")}
                    </ButtonBlack>
                  </DialogTrigger>
                  <RatingDialog onRatingSubmit={handleRatingComplete} />
                </Dialog>
              )}
              <div className=" h-fit p-3 bg-neutral-100 rounded-[3rem]">
                <Image src={More} width={20} height={20} alt="more" />
              </div>
            </div>
          </div>

          {/* feedback sent */}
          {feedback ? (
            <>
              <div className="flex flex-col gap-4">
                <Separator />
                <span className="text-deep-100 text-[1.6rem] font-semibold leading-9">
                  Your feedback
                </span>
                <p className="text-neutral-700 text-[1.5rem] leading-12">
                  {feedback}
                </p>
              </div>
              <div></div>
            </>
          ) : (
            <>
              <form
                onSubmit={onSubmit}
                className="flex flex-col h-full gap-6 p-6 rounded-[15px] border border-neutral-100 mb-8"
              >
                <div className="flex-1 flex lg:justify-center flex-col w-full gap-4">
                  <motion.h3
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="font-medium text-[1.6rem] leading-[22.5px] text-[#2E3237]"
                  >
                    {t("feedback.textArea.title")}
                  </motion.h3>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <TextArea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    >
                      {t("feedback.textArea.placeholder")}
                    </TextArea>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="w-full hidden lg:flex flex-col gap-8"
                  >
                    <ButtonPrimary
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <LoadingCircleSmall />
                      ) : (
                        t("feedback.textArea.submit")
                      )}
                    </ButtonPrimary>
                  </motion.div>
                </div>
                <div className="flex flex-col gap-6 w-full">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="lg:hidden"
                  >
                    <ButtonPrimary
                      type="submit"
                      disabled={isLoading}
                      className="w-full lg:hidden"
                    >
                      {isLoading ? (
                        <LoadingCircleSmall />
                      ) : (
                        t("feedback.textArea.submit")
                      )}
                    </ButtonPrimary>
                  </motion.div>
                </div>
              </form>
            </>
          )}
          <FeedbackSuccessDialog
            isOpen={showSuccess}
            onOpenChange={setShowSuccess}
          />
          {/* Tickets on mobile */}
          <div className="lg:hidden flex flex-col gap-4 pb-4">
            <TicketViewer tickets={mockTickets} event={mockEvent} />
          </div>
        </div>

        {/* Tickets on desktop (second column) */}
        <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-20 px-4 mb-4">
          <TicketViewer tickets={mockTickets} event={mockEvent} />
        </div>
      </main>
    </AttendeeLayout>
  );
}
