"use client";
import React, { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatePresence } from "motion/react";
import { DateTime } from "luxon";
import resizeImage from "@/lib/ResizeImage";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { UpdateGoogleMeetEvent } from "@/actions/EventActions";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import StepBasic from "./BasicDetails";
import StepDateTime from "./EventDays";
import StepTicket from "./TicketClasses";
import { makeEditMeetSchema } from "./schema";
import { Event, MembershipTier } from "@ticketwaze/typescript-config";
import { slugify } from "@/lib/Slugify";
import {
  CreateFooter,
  CreateHeader,
  StepPanel,
} from "@/components/create/CreateParts";
import useEventNameAvailability from "@/hooks/useEventNameAvailability";
import { EventDay } from "./types";
import useEventDocumentField from "@/hooks/useEventDocumentField";
import {
  uploadEventDocument,
  deleteEventDocument,
} from "@/lib/eventDocumentUpload";

export default function EditInPersonEventForm({
  event,
  membershipTier,
  maxMeetingMinutes,
  googleSeatLimit,
  paidTierName,
}: {
  event: Event;
  membershipTier: MembershipTier;
  /**
   * Longest a call may run on the plan hosting it, read live rather than frozen
   * at creation: the platform cuts the call at whatever today's plan allows.
   * Null when the provider's limit is not known.
   */
  maxMeetingMinutes: number | null;
  /**
   * Seats on the organisation's currently declared Google plan, used only as a
   * fallback for events created before the plan was declared. The event's own
   * stored cap wins where it has one — that is what its tickets were sold
   * against.
   */
  googleSeatLimit: number | null;
  /**
   * The paid tier's name, or null on a free plan OR a trial. The
   * trial-excluding signal the document rule needs.
   */
  paidTierName: string | null;
}) {
  const t = useTranslations("Events.create_event");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const [imageChanged, setImageChanged] = useState(false);
  const [isFree, setIsfree] = useState(
    (event.eventTicketTypes[0]?.ticketTypePrice ?? 0) < 1,
  );
  // The optional handout. `event.eventDocument` is whatever is stored today;
  // choosing a new file replaces it, and removing it deletes it outright.
  const document = useEventDocumentField({
    membershipTier,
    paidTierName,
    isFree,
  });
  const [isRefundable, setIsRefundable] = useState(
    event.eventTicketTypes[0]?.isRefundable ?? false,
  );
  const [isPrivate, setIsPrivate] = useState(event.isPrivate ?? false);

  // The cutoff is stored as UTC; the datetime-local input needs a naive value in
  // the event's own timezone so the organiser sees the instant they picked.
  const eventTimezone =
    event.eventDays[0]?.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  const ticketSalesEndAtDefault = event.ticketSalesEndAt
    ? DateTime.fromISO(event.ticketSalesEndAt)
        .setZone(eventTimezone)
        .toFormat("yyyy-MM-dd'T'HH:mm")
    : "";

  // create schema using factory (depends on isFree)
  const FormDataSchema = makeEditMeetSchema(
    isFree,
    (k, values) => t(k, values),
    membershipTier.freeTickets,
    // The cap this event was actually built against, which is what the API
    // measures an edit by. An older Google Meet event has none, and falls back
    // to what the organisation's declared plan allows today.
    event.onlineProvider === "zoom"
      ? (event.zoomSeatLimit ?? null)
      : (event.googleSeatLimit ?? googleSeatLimit),
    maxMeetingMinutes,
    event.onlineProvider === "zoom" ? "zoom" : "google_meet",
  );
  type TForm = z.infer<typeof FormDataSchema>;

  const steps = [
    {
      name: t("basic"),
      fields: [
        "eventName",
        "eventDescription",
        "address",
        "state",
        "city",
        "country",
        "activityTags",
        "eventImage",
      ],
    },
    { name: t("date_time"), fields: ["eventDays"] },
    { name: t("ticket"), fields: ["ticketTypes"] },
  ];

  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const delta = currentStep - previousStep;

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    trigger,
    watch,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<TForm>({
    resolver: zodResolver(FormDataSchema),
    defaultValues: {
      eventName: event.eventName,
      eventDescription: event.eventDescription,
      address: event.address,
      state: event.state,
      city: event.city,
      country: event.country,
      activityTags: event.activityTags,
      eventImage: undefined as unknown as File,
      eventDays: event.eventDays.map((eventDay) => {
        return {
          dayNumber: eventDay.dayNumber,
          eventDate: eventDay.eventDate.split("T")[0],
          startTime: eventDay.startTime,
          endTime: eventDay.endTime,
          timezone: eventDay.timezone,
        };
      }),
      ticketTypes: event.eventTicketTypes.map((ticketType) => ({
        eventTicketTypeId: ticketType.eventTicketTypeId,
        ticketTypeDescription: ticketType.ticketTypeDescription,
        ticketTypeName: ticketType.ticketTypeName,
        ticketTypePrice:
          event.currency === "USD"
            ? String(ticketType.usdPrice)
            : String(ticketType.ticketTypePrice),
        ticketTypeQuantity: String(ticketType.ticketTypeQuantity),
        salesStartAt: ticketType.salesStartAt
          ? DateTime.fromISO(ticketType.salesStartAt)
              .setZone(eventTimezone)
              .toFormat("yyyy-MM-dd'T'HH:mm")
          : "",
        salesEndAt: ticketType.salesEndAt
          ? DateTime.fromISO(ticketType.salesEndAt)
              .setZone(eventTimezone)
              .toFormat("yyyy-MM-dd'T'HH:mm")
          : "",
      })),
      eventCurrency: event.currency,
      isFree: event.isFree,
      absorbFees: event.absorbFees === true,
      ticketSalesEndAt: ticketSalesEndAtDefault,
    },
  });

  // submission
  const processForm: SubmitHandler<TForm> = async (data) => {
    const formData = new FormData();
    formData.append("eventName", data.eventName);
    formData.append("eventDescription", data.eventDescription);
    formData.append("address", data.address);
    formData.append("state", data.state);
    formData.append("city", data.city);
    formData.append("country", data.country);
    formData.append("activityTags", JSON.stringify(data.activityTags));
    formData.append("eventImage", data.eventImage);
    formData.append("eventDays", JSON.stringify(data.eventDays));
    formData.append("eventCurrency", data.eventCurrency);
    formData.append("isRefundable", JSON.stringify(isRefundable));
    formData.append("isFree", JSON.stringify(isFree));
    formData.append("absorbFees", JSON.stringify(data.absorbFees));
    formData.append("isPrivate", JSON.stringify(isPrivate));
    // The cutoff lives on each class now (migration 1785300000039 copied the
    // old event-wide one onto every class), so the event-level one is cleared.
    formData.append("ticketSalesEndAt", "");
    if (isFree) {
      formData.append(
        "ticketTypes",
        JSON.stringify([
          {
            eventTicketTypeId: event.eventTicketTypes[0]?.eventTicketTypeId,
            ticketTypeName: "General",
            ticketTypeDescription: t("general_default"),
            ticketTypePrice: "",
            ticketTypeQuantity:
              data.ticketTypes[0]?.ticketTypeQuantity ||
              String(membershipTier.freeTickets),
            salesStartAt: data.ticketTypes[0]?.salesStartAt || null,
            salesEndAt: data.ticketTypes[0]?.salesEndAt || null,
          },
        ]),
      );
    } else {
      formData.append(
        "ticketTypes",
        JSON.stringify(
          data.ticketTypes.map((ticket) => ({
            ...ticket,
            salesStartAt: ticket.salesStartAt || null,
            salesEndAt: ticket.salesEndAt || null,
          })),
        ),
      );
    }

    const result = await UpdateGoogleMeetEvent(
      organisation?.organisationId ?? "",
      formData,
      locale,
      event.eventId,
    );
    if (result.status === "success") {
      /*
       * The document is its own request, and deliberately NOT part of the edit
       * review flow above: it is not one of the details a buyer agreed to, so
       * swapping a handout does not need an admin to approve it.
       */
      if (document.removeExisting && !document.file) {
        const removed = await deleteEventDocument({
          organisationId: organisation?.organisationId ?? "",
          eventId: event.eventId,
          accessToken: session?.user.accessToken ?? "",
          locale,
        });
        if (removed.status === "failed") {
          toast.error(t("document.errors.removeFailed"));
        }
      } else if (document.file) {
        const upload = await uploadEventDocument({
          organisationId: organisation?.organisationId ?? "",
          eventId: event.eventId,
          accessToken: session?.user.accessToken ?? "",
          file: document.file,
          locale,
        });
        if (upload.status === "failed") {
          toast.error(t("document.errors.uploadFailed"));
        }
      }

      // The event has sales and this edit could change what those buyers think
      // they bought, so it is waiting on an admin rather than already live.
      // Saying so here is the difference between "nothing happened" and "your
      // change is queued" — the event page will still show the old details.
      if (result.pendingReview) toast.info(t("held_for_review"));
      const redirectUrl = `/events/show/${slugify(result.event.eventName, result.event.eventId)}`;
      router.push(redirectUrl);
    }
    if (result.error) toast.error(result.error);
  };

  type FieldName = keyof TForm;
  const [showConfirm, setShowConfirm] = useState(false);

  // Checked live per keystroke, the same as the create form. The event's own id
  // is excluded so keeping the name it already has never reads as taken.
  const nameStatus = useEventNameAvailability(
    watch("eventName"),
    event.eventId,
  );

  /**
   * Will this edit be held for review rather than applied straight away?
   *
   * Mirrors the server rule (fieldsNeedingReview): sales are the multiplier, and
   * only fields that could misrepresent what someone already bought count. No
   * address here — an online event has none. Predicted purely so the confirm
   * dialog can tell the truth; the API decides.
   */
  const ticketsSold = event.eventTicketTypes.reduce(
    (total, ticketType) => total + (ticketType.ticketTypeQuantitySold ?? 0),
    0,
  );
  const willBeHeldForReview =
    ticketsSold > 0 &&
    (imageChanged ||
      Boolean(dirtyFields.eventName) ||
      Boolean(dirtyFields.eventDescription) ||
      Boolean(dirtyFields.eventDays));

  const next = async () => {
    let fields: FieldName[];
    if (currentStep === 1) {
      const dayCount = getValues("eventDays").length;
      fields = Array.from({ length: dayCount }, (_, i) => [
        `eventDays.${i}.eventDate` as FieldName,
        `eventDays.${i}.startTime` as FieldName,
        `eventDays.${i}.endTime` as FieldName,
      ]).flat();
    } else if (currentStep === 2) {
      const ticketCount = getValues("ticketTypes").length;
      fields = Array.from({ length: ticketCount }, (_, i) => [
        `ticketTypes.${i}.ticketTypeName` as FieldName,
        `ticketTypes.${i}.ticketTypeDescription` as FieldName,
        `ticketTypes.${i}.ticketTypePrice` as FieldName,
        `ticketTypes.${i}.ticketTypeQuantity` as FieldName,
      ]).flat();
    } else {
      fields = steps[currentStep]?.fields as FieldName[];
    }
    const output = await trigger(fields, { shouldFocus: true });
    if (!output) {
      scrollToFirstError();
      return;
    }
    if (currentStep === steps.length - 1) {
      const hasChanges =
        isDirty ||
        imageChanged ||
        isFree !== event.isFree ||
        isPrivate !== (event.isPrivate ?? false) ||
        isRefundable !== (event.eventTicketTypes[0]?.isRefundable ?? false);
      if (!hasChanges) {
        toast.info(t("no_changes"));
        return;
      }
      setShowConfirm(true);
      return;
    }
    // The name is checked live per keystroke now, so leaving step 1 no longer
    // needs a round trip to re-validate what the field already knows. All that
    // is left is refusing to move on while the answer is bad or not yet in.
    if (currentStep === 0 && nameStatus === "taken") {
      setError(
        "eventName",
        { type: "manual", message: t("errors.basicDetails.nameTaken") },
        { shouldFocus: true },
      );
      return;
    }
    setPreviousStep(currentStep);
    setCurrentStep((s) => s + 1);
  };
  const prev = () => {
    if (currentStep > 0) {
      setPreviousStep(currentStep);
      setCurrentStep((s) => s - 1);
    }
  };

  const formRef = useRef<HTMLFormElement>(null);
  // Each step starts at its top, not wherever the last one was scrolled to.
  useEffect(() => {
    formRef.current?.scrollTo({ top: 0 });
  }, [currentStep]);

  /**
   * The details drawer's pencils link here with the section to edit:
   * #thumbnail and #about are on the first step, #details is the dates step.
   */
  useEffect(() => {
    const section = window.location.hash.slice(1);
    if (section === "details") {
      setCurrentStep(1);
      return;
    }
    if (section) {
      setTimeout(
        () =>
          window.document.getElementById(section)
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        400,
      );
    }
  }, []);

  // After a failed validation, bring the first error into view (custom fields
  // such as the map and the tags are not focusable, so focus alone misses them).
  const scrollToFirstError = () => {
    requestAnimationFrame(() => {
      const firstError = Array.from(
        formRef.current?.querySelectorAll<HTMLElement>(".text-failure") ?? [],
      ).find((el) => (el.textContent ?? "").trim().length > 0);
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  // Image handling
  const [imagePreview, setImagePreview] = useState<string>(event.eventImageUrl);
  useEffect(() => {
    const loadExistingImage = async () => {
      if (event.eventImageUrl) {
        try {
          const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(event.eventImageUrl)}`;
          const response = await fetch(proxiedUrl);
          const blob = await response.blob();
          const file = new File([blob], "event-image.jpg", {
            type: blob.type || "image/jpeg",
          });
          setValue("eventImage", file, {
            shouldValidate: true,
            shouldDirty: false,
          });
        } catch (error) {
          console.error("Failed to load existing image:", error);
        }
      }
    };

    loadExistingImage();
  }, [event.eventImageUrl, setValue]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    const blob = await resizeImage(file);
    const resized = new File([blob], "event-image.jpg", { type: "image/jpeg" });
    setValue("eventImage", resized, { shouldValidate: true });
    setImagePreview(URL.createObjectURL(resized));
    setImageChanged(true);
    input.value = "";
  };

  // eventDays + ticketClasses local state (for dynamic add/remove UI)
  const [eventDays, setEventDays] = useState<EventDay[]>(
    event.eventDays.map((eventDay) => {
      return {
        dayNumber: eventDay.dayNumber,
        eventDate: eventDay.eventDate,
        startTime: eventDay.startTime,
        endTime: eventDay.endTime,
        timezone: eventDay.timezone,
      };
    }),
  );

  return (
    // `overflow-clip`, not `overflow-hidden`. See CreateInPersonEventForm: an
    // `overflow-hidden` box is still a scroll container, so Tiptap's
    // scroll-caret-into-view after a paste shifts it permanently, with no
    // scrollbar or wheel for the user to shift it back. `clip` does not scroll.
    <div className="relative flex flex-col gap-10 overflow-clip h-full">
      <CreateHeader
        title={t("edit_title")}
        steps={steps.map((s) => s.name)}
        current={currentStep}
        onBack={currentStep > 0 ? prev : () => window.history.back()}
      />

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-primary font-medium text-[2.2rem] leading-12 text-black">
              {t("edit_warning_title")}
            </DialogTitle>
            <DialogDescription className="text-[1.5rem] leading-8 text-neutral-600">
              {willBeHeldForReview
                ? t("edit_warning_body_review")
                : t("edit_warning_body")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4 pt-2">
            <DialogClose asChild>
              <button
                type="button"
                className="flex-1 px-[3rem] py-[15px] border border-neutral-200 rounded-[100px] text-neutral-600 font-medium text-[1.5rem] leading-8 cursor-pointer"
              >
                {t("edit_warning_cancel")}
              </button>
            </DialogClose>
            <DialogClose asChild>
              <button
                type="button"
                onClick={() => handleSubmit(processForm)()}
                className="flex-1 bg-primary-500 px-[3rem] py-[15px] rounded-[100px] text-white font-medium text-[1.5rem] leading-8 cursor-pointer"
              >
                {t("edit_warning_confirm")}
              </button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <form
        ref={formRef}
        className="flex flex-col gap-12 flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        onSubmit={handleSubmit(processForm)}
      >
        <AnimatePresence mode="wait" initial={false}>
          {currentStep === 0 && (
            <StepPanel stepKey="basic" direction={delta}>
              <StepBasic
                register={register}
                control={control}
                errors={errors}
                imagePreview={imagePreview}
                handleFileChange={handleFileChange}
                setValue={setValue}
                getValues={getValues}
                event={event}
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                nameStatus={nameStatus}
                document={document}
              />
            </StepPanel>
          )}

          {currentStep === 1 && (
            <StepPanel stepKey="days" direction={delta}>
              <StepDateTime
                register={register}
                control={control}
                errors={errors}
                eventDays={eventDays as EventDay[]}
                setEventDays={
                  setEventDays as React.Dispatch<
                    React.SetStateAction<EventDay[]>
                  >
                }
                setValue={setValue}
                t={(k) => t(k)}
                membershipTier={membershipTier}
              />
            </StepPanel>
          )}

          {currentStep === 2 && (
            <StepPanel stepKey="tickets" direction={delta}>
              <StepTicket
                event={event}
                register={register}
                errors={errors}
                isFree={isFree}
                setIsFree={setIsfree}
                isRefundable={isRefundable}
                setIsRefundable={setIsRefundable}
                setValue={setValue}
                t={(k) => t(k)}
                control={control}
                membershipTier={membershipTier}
              />
            </StepPanel>
          )}
        </AnimatePresence>
      </form>

      <CreateFooter
        step={currentStep}
        total={steps.length}
        onBack={currentStep > 0 ? prev : undefined}
        onContinue={next}
        continueLabel={
          currentStep === steps.length - 1 ? t("save_cta") : undefined
        }
        loading={isSubmitting}
        disabled={currentStep === 0 && nameStatus === "checking"}
      />
    </div>
  );
}
