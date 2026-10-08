"use client";
import React, { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence } from "motion/react";
import resizeImage from "@/lib/ResizeImage";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FieldErrors } from "react-hook-form";
import {
  CreateInPersonEvent,
  PublishComingSoonEvent,
} from "@/actions/EventActions";
import useEventNameAvailability from "@/hooks/useEventNameAvailability";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import StepBasic from "./BasicDetails";
import StepDateTime from "./EventDays";
import StepTicket from "./TicketClasses";
import { makeCreateInPersonSchema } from "./schema";
import {
  CreateFooter,
  CreateHeader,
  CreatedScreen,
  EVENT_CATEGORIES,
  StepPanel,
} from "@/components/create/CreateParts";
import { slugify } from "@/lib/Slugify";
import { EventDay } from "./types";
import { Event, MembershipTier } from "@ticketwaze/typescript-config";

export default function CreateInPersonEventForm({
  eventType,
  membershipTier,
  teaser,
  topSlot,
  onExit,
}: {
  /** Initial category (Concert, Festival…); chosen in the form when empty. */
  eventType: string;
  membershipTier: MembershipTier;
  /** The unified create page's Physical/Virtual select, shown on step 1. */
  topSlot?: React.ReactNode;
  /** "Back" on the first step; defaults to the browser's back. */
  onExit?: () => void;
  /**
   * Set when this wizard is finishing a "coming soon" teaser rather than
   * creating an event from nothing. Everything the teaser already answered is
   * prefilled, and submitting publishes that row instead of inserting a new
   * one — the teaser's id, followers and reservations all carry over.
   */
  teaser?: Event;
}) {
  const t = useTranslations("Events.create_event");
  const locale = useLocale();
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  /*
   * `router.push`, NOT `redirect()` — see the online create form for the full
   * reason. Short version: `redirect()` navigates by THROWING, and
   * react-hook-form re-throws it, so every successful creation also reported an
   * "Unhandled rejection: NEXT_REDIRECT".
   */
  const router = useRouter();
  const isPublishing = Boolean(teaser);
  const [isFree, setIsfree] = useState(false);
  const [isRefundable, setIsRefundable] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  // Chosen in Event Details now (it used to be its own page before the form).
  const [category, setCategory] = useState(eventType || "");
  const [categoryError, setCategoryError] = useState<string>();
  // Set once the event exists: the success screen shows while we open it.
  const [created, setCreated] = useState(false);

  // The schema no longer depends on `isFree`: whether a price is required is a
  // per-tier question now, answered by each tier's own flag.
  const FormDataSchema = makeCreateInPersonSchema(
    (k, values) => t(k, values),
    membershipTier.freeTickets,
    // The teaser's cover image already exists server-side.
    isPublishing,
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
        "location",
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
    setError,
    control,
    trigger,
    watch,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<TForm>({
    resolver: zodResolver(FormDataSchema),
    // Steps are gated with `trigger`, which never marks the form submitted, so
    // under the default onSubmit mode an error stayed on screen after the
    // field was corrected ("Price cannot be empty" beside a typed price). Once
    // a field has been touched it now re-validates as it changes.
    mode: "onTouched",
    defaultValues: {
      // A teaser answered the "what and where" questions already; the wizard
      // exists to collect what it could not: dates, tickets and a precise venue.
      eventName: teaser?.eventName ?? "",
      eventDescription: teaser?.eventDescription ?? "",
      address: teaser?.address ?? "",
      state: teaser?.state ?? "",
      city: teaser?.city ?? "",
      country: teaser?.country || "Haiti",
      location: { lat: undefined, lng: undefined },
      eventImage: undefined as unknown as File,
      eventDays: [
        {
          dayNumber: 1,
          eventDate: "",
          startTime: "",
          endTime: "",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      ],
      activityTags: teaser?.activityTags ?? [],
      ticketTypes: [
        {
          ticketTypeName: membershipTier.customTicketTypes ? "" : "General",
          ticketTypeDescription: membershipTier.customTicketTypes
            ? ""
            : t("general.description"),
          ticketTypePrice: "",
          ticketTypeQuantity: "",
          isFree: false,
          salesStartAt: "",
          salesEndAt: "",
        },
      ],
      eventCurrency: "HTG",
      isFree: false,
      absorbFees: false,
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
    formData.append("location", JSON.stringify(data.location));
    // Omitted when publishing a teaser that keeps its existing cover image;
    // sending an empty part would fail the API's file validation.
    if (data.eventImage) formData.append("eventImage", data.eventImage);
    formData.append("eventDays", JSON.stringify(data.eventDays));
    formData.append("eventCurrency", data.eventCurrency);
    formData.append("eventType", category);
    // The activity is free only when EVERY tier is. The API derives this from
    // the prices anyway and ignores what we send, but sending the truth keeps
    // the two from telling different stories in a request log.
    const allTiersFree =
      data.ticketTypes.length > 0 &&
      data.ticketTypes.every((ticket) => ticket.isFree);
    formData.append("isFree", JSON.stringify(allTiersFree));
    formData.append("absorbFees", JSON.stringify(data.absorbFees));
    formData.append("activityTags", JSON.stringify(data.activityTags));
    formData.append("isRefundable", JSON.stringify(isRefundable));
    formData.append("isPrivate", JSON.stringify(isPrivate));
    if (data.ticketSalesEndAt) {
      formData.append("ticketSalesEndAt", data.ticketSalesEndAt);
    }
    /**
     * A free plan's activity-wide switch still collapses to the one locked
     * "General" tier it always did — those inputs are read-only, so the values
     * have to be supplied here rather than read back off the form.
     *
     * Everything else goes through as typed, with the form-only `isFree` flag
     * turned into the price 0 that the API actually stores. The flag itself is
     * dropped: the price is the source of truth server-side, and sending both
     * invites them to disagree.
     */
    if (!membershipTier.customTicketTypes && isFree) {
      formData.append(
        "ticketTypes",
        JSON.stringify([
          {
            ticketTypeName: "General",
            ticketTypeDescription: t("general_default"),
            ticketTypePrice: "0",
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
          data.ticketTypes.map(({ isFree: tierIsFree, ...ticket }) => ({
            ...ticket,
            ticketTypePrice: tierIsFree ? "0" : ticket.ticketTypePrice,
            // An empty picker means open-ended, which the API reads as null.
            salesStartAt: ticket.salesStartAt || null,
            salesEndAt: ticket.salesEndAt || null,
          })),
        ),
      );
    }

    const result = teaser
      ? await PublishComingSoonEvent(
          organisation?.organisationId ?? "",
          teaser.eventId,
          formData,
          locale,
        )
      : await CreateInPersonEvent(
          organisation?.organisationId ?? "",
          formData,
          locale,
        );
    if (result.status === "success") {
      // Figma's "Event Created Successfully — Opening event…", then the event.
      setCreated(true);
      const newId = "eventId" in result ? result.eventId : undefined;
      const newName = "eventName" in result ? result.eventName : undefined;
      const target = teaser
        ? `/events/show/${slugify(teaser.eventName, teaser.eventId)}`
        : newId
          ? `/events/show/${slugify(newName ?? data.eventName, newId)}`
          : "/events";
      setTimeout(() => router.push(target), 1800);
    }
    if (result.error) toast.error(result.error);
  };

  type FieldName = keyof TForm;

  // Name availability is checked live (per keystroke) instead of on step submit.
  // Skipped when publishing a teaser: the name is locked and the only row using
  // it is this one, so the check would report the teaser's own name as taken.
  const liveNameStatus = useEventNameAvailability(
    isPublishing ? "" : watch("eventName"),
  );
  const nameStatus = isPublishing ? "idle" : liveNameStatus;

  const formRef = useRef<HTMLFormElement>(null);
  // Each step starts at its top, not wherever the last one was scrolled to.
  useEffect(() => {
    formRef.current?.scrollTo({ top: 0 });
  }, [currentStep]);

  // After a failed validation, bring the first field in error into view. RHF's
  // shouldFocus only scrolls focusable native inputs, so custom fields (map,
  // tags, image) are missed — scroll to the first rendered error message
  // instead, which every field type shares (.text-failure).
  const scrollToFirstError = (delay = 0) => {
    setTimeout(() => {
      requestAnimationFrame(() => {
        const container = formRef.current;
        if (!container) return;
        const firstError = Array.from(
          container.querySelectorAll<HTMLElement>(".text-failure"),
        ).find((el) => (el.textContent ?? "").trim().length > 0);
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }, delay);
  };

  /**
   * The final submit validates EVERY step, not just the one on screen. A field
   * passed on an earlier step can be invalid by then (the state select used to
   * get emptied behind the organiser's back), and its error only renders on its
   * own step — so the button appeared to do nothing. Take them to it instead.
   */
  const showFirstInvalidStep = (formErrors: FieldErrors<TForm>) => {
    const invalid = Object.keys(formErrors);
    const stepIndex = steps.findIndex((step) =>
      step.fields.some((field) => invalid.includes(field)),
    );
    if (stepIndex >= 0 && stepIndex !== currentStep) {
      setPreviousStep(currentStep);
      setCurrentStep(stepIndex);
      toast.error(t("errors.reviewStep", { step: steps[stepIndex]!.name }));
      scrollToFirstError(350);
      return;
    }
    scrollToFirstError();
  };

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
    const categoryMissing = currentStep === 0 && !category;
    setCategoryError(categoryMissing ? t("errors.basicDetails.category") : undefined);
    const output = await trigger(fields, { shouldFocus: true });
    if (!output || categoryMissing) {
      scrollToFirstError();
      return;
    }
    if (currentStep === 0 && nameStatus === "taken") {
      setError(
        "eventName",
        { type: "manual", message: t("errors.basicDetails.nameTaken") },
        { shouldFocus: true },
      );
      scrollToFirstError();
      return;
    }
    if (currentStep === steps.length - 1) {
      await handleSubmit(processForm, showFirstInvalidStep)();
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

  // Image handling. A teaser opens showing the cover it was announced with;
  // picking a new file replaces it, leaving it alone keeps it.
  const [imagePreview, setImagePreview] = useState<string | null>(
    teaser?.eventImageUrl ?? null,
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    const blob = await resizeImage(file);
    const resized = new File([blob], "event-image.jpg", { type: "image/jpeg" });
    setValue("eventImage", resized, { shouldValidate: true });
    setImagePreview(URL.createObjectURL(resized));
    input.value = "";
  };

  // eventDays (for dynamic add/remove UI)
  const [eventDays, setEventDays] = useState<EventDay[]>([
    {
      dayNumber: 1,
      eventDate: "",
      startTime: "",
      endTime: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  ]);

  if (created) {
    return (
      <CreatedScreen
        title={t(teaser ? "created.published_title" : "created.title")}
        description={t("created.description")}
        pendingLabel={t("created.opening")}
      />
    );
  }

  return (
    // `overflow-clip`, not `overflow-hidden`: `hidden` makes this a scroll
    // container, which Tiptap's scroll-into-view after a paste can shift
    // permanently. `clip` clips identically but is not a scroll container.
    <div className="relative flex flex-col gap-10 overflow-clip h-full">
      <CreateHeader
        title={t(teaser ? "publish_title" : "title_event")}
        steps={steps.map((s) => s.name)}
        current={currentStep}
        onBack={
          currentStep > 0 ? prev : (onExit ?? (() => window.history.back()))
        }
      />

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
                isPrivate={isPrivate}
                setIsPrivate={setIsPrivate}
                nameStatus={nameStatus}
                nameLocked={isPublishing}
                topSlot={topSlot}
                category={category}
                onCategoryChange={(value) => {
                  setCategory(value);
                  setCategoryError(undefined);
                }}
                categories={EVENT_CATEGORIES}
                categoryError={categoryError}
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
                  setEventDays as React.Dispatch<React.SetStateAction<EventDay[]>>
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
          currentStep === steps.length - 1
            ? t(teaser ? "publish_cta" : "create_cta")
            : undefined
        }
        loading={isSubmitting}
        disabled={currentStep === 0 && nameStatus === "checking"}
      />
    </div>
  );
}
