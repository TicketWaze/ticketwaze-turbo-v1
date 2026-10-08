"use client";
import React, { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence } from "motion/react";
import resizeImage from "@/lib/ResizeImage";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler, FieldErrors } from "react-hook-form";
import { CreateGoogleMeetEvent } from "@/actions/EventActions";
import useEventNameAvailability from "@/hooks/useEventNameAvailability";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import StepBasic from "./BasicDetails";
import StepDateTime from "./EventDays";
import StepTicket from "./TicketClasses";
import { makeMeetPersonSchema, type OnlineProvider } from "./schema";
import { EventDay } from "./types";
import { MembershipTier } from "@ticketwaze/typescript-config";
import { uploadEventDocument } from "@/lib/eventDocumentUpload";
import useEventDocumentField from "@/hooks/useEventDocumentField";
import {
  CreateFooter,
  CreateHeader,
  CreatedScreen,
  ONLINE_EVENT_CATEGORIES,
  StepPanel,
} from "@/components/create/CreateParts";
import EventLinkCard, {
  type OnlineProviders,
} from "@/components/create/EventLinkCard";
import { slugify } from "@/lib/Slugify";

export default function CreateMeetEventForm({
  eventType,
  code,
  providers,
  initialProvider,
  membershipTier,
  paidTierName,
  topSlot,
  onExit,
}: {
  /** Initial category; chosen in Event Details when empty. */
  eventType: string;
  /** Google's OAuth code, when we just came back from connecting. */
  code: string | undefined;
  /** What each hosted platform can do for this organisation right now. */
  providers: OnlineProviders;
  initialProvider?: OnlineProvider;
  membershipTier: MembershipTier;
  /**
   * The paid tier's name, or null on a free plan OR a trial: the
   * trial-excluding signal the document rule needs.
   */
  paidTierName: string | null;
  /** The unified create page's Physical/Virtual select, shown on step 1. */
  topSlot?: React.ReactNode;
  onExit?: () => void;
}) {
  const t = useTranslations("Events.create_event");
  const locale = useLocale();
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  /*
   * `router.push`, NOT `redirect()`: `redirect()` navigates by THROWING, and
   * react-hook-form re-throws it, so every success also shipped an
   * "Unhandled rejection: NEXT_REDIRECT".
   */
  const router = useRouter();
  const [isFree, setIsfree] = useState(false);
  const [isRefundable, setIsRefundable] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [category, setCategory] = useState(eventType || "");
  const [categoryError, setCategoryError] = useState<string>();
  const [provider, setProvider] = useState<OnlineProvider | "">(
    initialProvider ?? "",
  );
  const [providerError, setProviderError] = useState<string>();
  const [created, setCreated] = useState(false);
  // The optional handout, uploaded after the event exists (its S3 key is
  // scoped to the event id).
  const document = useEventDocumentField({ membershipTier, paidTierName, isFree });

  // The hosted platform's plan limits; an "other link" has none we can know.
  const limits =
    provider === "zoom" || provider === "google_meet"
      ? providers[provider]
      : { seatLimit: null, maxMinutes: null };

  const FormDataSchema = makeMeetPersonSchema(
    isFree,
    (k, values) => t(k, values),
    membershipTier.freeTickets,
    limits.seatLimit,
    limits.maxMinutes,
    provider || "zoom",
  );
  type TForm = z.infer<typeof FormDataSchema>;

  const steps = [
    {
      name: t("basic"),
      fields: [
        "eventName",
        "eventDescription",
        "activityTags",
        "eventImage",
        "onlineLink",
        "onlinePassword",
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
    // Steps are gated with `trigger`; once touched a field re-validates live.
    mode: "onTouched",
    defaultValues: {
      eventName: "",
      eventDescription: "",
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
      activityTags: [],
      ticketTypes: [
        {
          ticketTypeName: membershipTier.customTicketTypes ? "" : "General",
          ticketTypeDescription: membershipTier.customTicketTypes
            ? ""
            : t("general.description"),
          ticketTypePrice: "",
          ticketTypeQuantity: "",
          salesStartAt: "",
          salesEndAt: "",
        },
      ],
      eventCurrency: "HTG",
      isFree: false,
      absorbFees: false,
      onlineLink: "",
      onlinePassword: "",
    },
  });

  const processForm: SubmitHandler<TForm> = async (data) => {
    if (!provider) return;
    const formData = new FormData();
    formData.append("eventName", data.eventName);
    formData.append("eventDescription", data.eventDescription);
    formData.append("eventImage", data.eventImage);
    formData.append("eventDays", JSON.stringify(data.eventDays));
    formData.append("eventCurrency", data.eventCurrency);
    formData.append("eventType", category);
    formData.append("onlineProvider", provider);
    if (provider === "custom") {
      formData.append("onlineLink", (data.onlineLink ?? "").trim());
      if (data.onlinePassword?.trim()) {
        formData.append("onlinePassword", data.onlinePassword.trim());
      }
    }
    formData.append("isFree", JSON.stringify(data.isFree));
    formData.append("absorbFees", JSON.stringify(data.absorbFees));
    formData.append("activityTags", JSON.stringify(data.activityTags));
    formData.append("isRefundable", JSON.stringify(isRefundable));
    formData.append("isPrivate", JSON.stringify(isPrivate));
    if (isFree) {
      formData.append(
        "ticketTypes",
        JSON.stringify([
          {
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

    const result = await CreateGoogleMeetEvent(
      organisation?.organisationId ?? "",
      formData,
      locale,
      decodeURIComponent(code ?? ""),
    );
    if (result.status === "success") {
      /*
       * The document goes up AFTER the event (its key needs the event id). A
       * failure here does not fail the event — it is already created; the
       * handout can be re-attached from the edit screen.
       */
      const upload = await uploadEventDocument({
        organisationId: organisation?.organisationId ?? "",
        eventId: result.eventId ?? "",
        accessToken: session?.user.accessToken ?? "",
        file: document.file,
        locale,
      });
      if (upload.status === "failed") {
        toast.error(t("document.errors.uploadFailedAfterCreate"));
      }
      setCreated(true);
      const target = result.eventId
        ? `/events/show/${slugify(data.eventName, result.eventId)}`
        : "/events";
      setTimeout(() => router.push(target), 1800);
    }
    if (result.error) toast.error(result.error);
  };

  type FieldName = keyof TForm;

  const nameStatus = useEventNameAvailability(watch("eventName"));
  const formRef = useRef<HTMLFormElement>(null);
  // Each step starts at its top, not wherever the last one was scrolled to.
  useEffect(() => {
    formRef.current?.scrollTo({ top: 0 });
  }, [currentStep]);

  // Bring the first rendered error into view (custom fields are not focusable).
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

  /** The final submit validates every step; take the organiser to the bad one. */
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

  /** Step 1 also needs a category and a platform that can actually host. */
  const checkBasics = () => {
    const categoryMissing = !category;
    setCategoryError(categoryMissing ? t("errors.basicDetails.category") : undefined);
    let platformProblem: string | undefined;
    if (!provider) platformProblem = t("event_link.errors.platform");
    else if (provider !== "custom" && !providers[provider].ready) {
      platformProblem = t("event_link.errors.not_ready");
    }
    setProviderError(platformProblem);
    return !categoryMissing && !platformProblem;
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
    const basicsOk = currentStep === 0 ? checkBasics() : true;
    const output = await trigger(fields, { shouldFocus: true });
    if (!output || !basicsOk) {
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

  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
        title={t("created.title")}
        description={t("created.description")}
        pendingLabel={t("created.opening")}
      />
    );
  }

  return (
    // `overflow-clip`, not `overflow-hidden`: see CreateInPersonEventForm.
    <div className="relative flex flex-col gap-10 overflow-clip h-full">
      <CreateHeader
        title={t("title_event")}
        steps={steps.map((s) => s.name)}
        current={currentStep}
        onBack={currentStep > 0 ? prev : (onExit ?? (() => window.history.back()))}
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
                document={document}
                topSlot={topSlot}
                category={category}
                onCategoryChange={(value) => {
                  setCategory(value);
                  setCategoryError(undefined);
                }}
                categories={ONLINE_EVENT_CATEGORIES}
                categoryError={categoryError}
                linkSlot={
                  <EventLinkCard
                    provider={provider}
                    onProviderChange={(value) => {
                      setProvider(value);
                      setProviderError(undefined);
                    }}
                    providers={providers}
                    linkProps={register("onlineLink")}
                    passwordProps={register("onlinePassword")}
                    linkError={errors.onlineLink?.message as string | undefined}
                    error={providerError}
                  />
                }
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
        continueLabel={currentStep === steps.length - 1 ? t("create_cta") : undefined}
        loading={isSubmitting}
        disabled={currentStep === 0 && nameStatus === "checking"}
      />
    </div>
  );
}
