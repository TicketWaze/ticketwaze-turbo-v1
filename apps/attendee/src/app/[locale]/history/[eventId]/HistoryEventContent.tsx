"use client";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import Image from "next/image";
import { motion } from "framer-motion";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { slugify } from "@/lib/Slugify";
import { Link, usePathname } from "@/i18n/navigation";
import { Event, Organisation, Ticket } from "@ticketwaze/typescript-config";
import ActivityMoreMenu from "@/components/activity/ActivityMoreMenu";
import MoreInfoDialog from "@/components/activity/MoreInfoDialog";
import { Star1 } from "iconsax-reactjs";
import TicketViewer from "./TicketViewer";
import BackButton from "@/components/shared/BackButton";
import FeedbackSuccessDialog from "./FeedbackSuccessDialog";
import { ButtonBlack, ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { TextArea } from "@/components/shared/Inputs";
import { useLocale, useTranslations } from "next-intl";
import React, { useRef, useState } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import RatingDialog from "./RatingDialog";
import Separator from "@/components/shared/Separator";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { SubmitReviewAction } from "@/actions/eventActions";

type HistoryEvent = Event & {
  tickets: Ticket[];
  organisation: Organisation;
};

export default function HistoryEventContent({
  event,
  review,
}: {
  event: HistoryEvent;
  review: { rating: number; reviewText: string } | null;
}) {
  const t = useTranslations("History.activity");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();

  const organisation = event.organisation;
  const organisationName = organisation?.organisationName ?? "";
  const eventName = event.eventName;
  const isVerified = organisation?.isVerified ?? false;
  const organisationId = organisation?.organisationId;

  // Seed from the user's existing review so the page reflects what they already
  // submitted (stars filled, feedback shown).
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [feedback, setFeedback] = useState(review?.reviewText ?? "");
  const [comment, setComment] = useState("");
  // Where the day-after feedback email lands: `?rate=1..5` from one of its
  // stars (that many pre-selected), `?rate=open` from its button. The rating
  // opens straight away, unless it is already done; the tap is still
  // confirmed in the dialog, so a mis-tap in the email never counts on its own.
  const searchParams = useSearchParams();
  const rateParam = searchParams.get("rate");
  const emailStars = /^[1-5]$/.test(rateParam ?? "") ? Number(rateParam) : 0;
  const [showRating, setShowRating] = useState(
    () => rateParam !== null && !review?.rating,
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  async function handleRatingComplete(value: number) {
    const token = session?.user?.accessToken ?? "";
    // The dialog stays open with its spinner until the API answers, so a
    // failed save leaves the chosen stars in place to retry.
    const res = await SubmitReviewAction(
      token,
      event.eventId,
      { rating: value },
      pathname,
      locale,
    );
    if (res.status === "success") {
      setRating(value);
      setShowRating(false);
    } else {
      toast.error(res.message);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = comment.trim();
    if (!text) return;
    setIsLoading(true);
    const token = session?.user?.accessToken ?? "";
    const res = await SubmitReviewAction(
      token,
      event.eventId,
      { reviewText: text },
      pathname,
      locale,
    );
    setIsLoading(false);
    if (res.status === "success") {
      setFeedback(text);
      setShowSuccess(true);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <AttendeeLayout title={eventName}>
      <BackButton text={t("back")} />
      <div className="grid grid-cols-1 lg:grid-cols-[29fr_23fr] w-full ">
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {eventName}
        </span>
        <div className={"flex items-center justify-between w-full"}>
          <div className={"flex items-center gap-4 lg:px-5"}>
            {organisation?.profileImageUrl ? (
              <Image
                src={organisation.profileImageUrl}
                width={56}
                height={56}
                alt={organisationName}
                className="shrink-0 w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <span className="shrink-0 w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
                {organisationName.slice()[0]?.toUpperCase()}
              </span>
            )}

            <div className={"flex flex-col"}>
              <span
                className={
                  "font-normal text-[1.4rem] lg:text-[1.6rem] leading-8 text-deep-200"
                }
              >
                {organisationName}{" "}
                {isVerified && <VerifiedOrganisationCheckMark />}
              </span>
            </div>
          </div>
          <Link
            href={`/organisations/${slugify(organisationName, organisationId ?? "")}`}
            className="border-2 py-[7.5px] px-6 lg:px-12 rounded-[100px] border-black font-semibold text-[1.5rem] whitespace-nowrap"
          >
            {t("viewProfile")}
          </Link>
        </div>
      </div>
      <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 lg:overflow-y-auto lg:h-full">
        {/* Left column content */}
        <div className="flex flex-col gap-8 lg:overflow-y-auto min-h-0">
          {event.eventImageUrl && (
            <div className="w-full max-h-[29.8rem] overflow-hidden rounded-[10px] shrink-0">
              <Image
                src={event.eventImageUrl}
                width={580}
                height={298}
                alt={eventName}
                className="w-full"
              />
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex gap-2" role="img" aria-label={`${rating}/5`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <motion.span
                  // Re-keyed on the rating, so a new rating sweeps in.
                  key={`${rating}-${index}`}
                  className="flex"
                  initial={index < rating ? { scale: 0.4, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.06,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  <Star1
                    size="25"
                    color={index < rating ? "#E45B00" : "#ABB0B9"}
                    variant="Bulk"
                  />
                </motion.span>
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
                  <RatingDialog
                    onRatingSubmit={handleRatingComplete}
                    initialRating={emailStars}
                  />
                </Dialog>
              )}
              <ActivityMoreMenu
                activityId={event.eventId}
                organisationId={event.organisationId}
                extra={
                  <MoreInfoDialog
                    aboutHtml={event.eventDescription}
                    email={organisation?.organisationEmail}
                    phone={organisation?.organisationPhoneNumber}
                    website={organisation?.organisationWebsite}
                  />
                }
              />
            </div>
          </div>

          {/* feedback sent */}
          {feedback ? (
            <>
              <motion.div
                ref={feedbackRef}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col gap-4 scroll-mt-8"
              >
                <Separator />
                <span className="text-deep-100 text-[1.6rem] font-semibold leading-9">
                  {t("feedback.title")}
                </span>
                <p className="text-neutral-700 text-[1.5rem] leading-12">
                  {feedback}
                </p>
              </motion.div>
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
                      disabled={isLoading || !comment.trim()}
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
                      disabled={isLoading || !comment.trim()}
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
            onView={() => {
              setShowSuccess(false);
              feedbackRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          />
          {/* Tickets on mobile */}
          <div className="lg:hidden flex flex-col gap-4 pb-4">
            <TicketViewer tickets={event.tickets} event={event} />
          </div>
        </div>

        {/* Tickets on desktop (second column) */}
        <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-20 px-4 mb-4">
          <TicketViewer tickets={event.tickets} event={event} />
        </div>
      </main>
    </AttendeeLayout>
  );
}
