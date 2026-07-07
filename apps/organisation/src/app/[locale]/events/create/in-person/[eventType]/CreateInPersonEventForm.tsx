"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft2 } from "iconsax-reactjs";
import { motion } from "motion/react";
import resizeImage from "@/lib/ResizeImage";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { CreateInPersonEvent } from "@/actions/EventActions";
import useEventNameAvailability from "@/hooks/useEventNameAvailability";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import StepBasic from "./BasicDetails";
import StepDateTime from "./EventDays";
import StepTicket from "./TicketClasses";
import { makeCreateInPersonSchema } from "./schema";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import BackButton from "@/components/shared/BackButton";
import { EventDay } from "./types";
import { MembershipTier } from "@ticketwaze/typescript-config";

export default function CreateInPersonEventForm({
  eventType,
  membershipTier,
}: {
  eventType: string;
  membershipTier: MembershipTier;
}) {
  const t = useTranslations("Events.create_event");
  const locale = useLocale();
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const [isFree, setIsfree] = useState(false);
  const [isRefundable, setIsRefundable] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  // create schema using factory (depends on isFree)
  const FormDataSchema = makeCreateInPersonSchema(
    isFree,
    (k, values) => t(k, values),
    membershipTier.freeTickets,
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
    defaultValues: {
      eventName: "",
      eventDescription: "",
      address: "",
      state: "",
      city: "",
      country: "Haiti",
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
      activityTags: [],
      ticketTypes: [
        {
          ticketTypeName: membershipTier.customTicketTypes ? "" : "General",
          ticketTypeDescription: membershipTier.customTicketTypes
            ? ""
            : t("general.description"),
          ticketTypePrice: "",
          ticketTypeQuantity: "",
        },
      ],
      eventCurrency: "HTG",
      isFree: false,
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
    formData.append("eventImage", data.eventImage);
    formData.append("eventDays", JSON.stringify(data.eventDays));
    formData.append("eventCurrency", data.eventCurrency);
    formData.append("eventType", eventType);
    formData.append("isFree", JSON.stringify(data.isFree));
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
          },
        ]),
      );
    } else {
      formData.append("ticketTypes", JSON.stringify(data.ticketTypes));
    }

    const result = await CreateInPersonEvent(
      organisation?.organisationId ?? "",
      session?.user.accessToken ?? "",
      formData,
      locale,
    );
    if (result.status === "success") {
      toast.success("success");
      redirect("/events");
    }
    if (result.error) toast.error(result.error);
  };

  type FieldName = keyof TForm;

  // Name availability is checked live (per keystroke) instead of on step submit.
  const nameStatus = useEventNameAvailability(watch("eventName"));

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
    if (!output) return;
    if (currentStep === 0 && nameStatus === "taken") {
      setError(
        "eventName",
        { type: "manual", message: t("errors.basicDetails.nameTaken") },
        { shouldFocus: true },
      );
      return;
    }
    if (currentStep === steps.length - 1) {
      await handleSubmit(processForm)();
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

  // Image handling
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

  return (
    <div className="relative flex flex-col gap-8 overflow-hidden h-full ">
      <div className="absolute bottom-4 z-9999 w-full hidden lg:block">
        <ButtonPrimary
          onClick={next}
          className=" w-full max-w-212 mx-auto  "
          disabled={
            isSubmitting || (currentStep === 0 && nameStatus === "checking")
          }
        >
          {isSubmitting ? <LoadingCircleSmall /> : t("proceed")}
        </ButtonPrimary>
      </div>

      <div className="fixed lg:hidden bottom-36 w-full px-8 z-50 left-0">
        <div className=" lg:hidden bg-white mx-auto border border-neutral-100 px-4 py-2 flex justify-between items-center rounded-[100px]">
          <div className="text-[2.2rem] text-neutral-600">
            <span className="text-primary-500">{currentStep + 1}</span>/3
          </div>
          <ButtonPrimary
            onClick={next}
            disabled={
              isSubmitting || (currentStep === 0 && nameStatus === "checking")
            }
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("proceed")}
          </ButtonPrimary>
        </div>
      </div>

      {currentStep === 0 ? (
        <BackButton text={t("back")}>
          <div className="flex justify-between">
            <div className="hidden lg:flex items-center gap-4">
              <span className="text-primary-500 font-medium text-[1.5rem] leading-12 ">
                {t("basic")}
              </span>
              <div className="w-[16.1rem] h-2 rounded-[100px] bg-neutral-100" />
              <span className="text-neutral-500 font-medium text-[1.5rem] leading-12 ">
                {t("date_time")}
              </span>
              <div className="w-[16.1rem] h-2 rounded-[100px] bg-neutral-100" />
              <span className="text-neutral-500 font-medium text-[1.5rem] leading-12 ">
                {t("ticket")}
              </span>
            </div>
          </div>
        </BackButton>
      ) : (
        <div className="flex items-center justify-between">
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
          <div className="hidden lg:flex items-center gap-4">
            <span className="text-primary-500 font-medium text-[1.5rem] leading-12 ">
              {t("basic")}
            </span>
            <div className="w-[16.1rem] h-2 rounded-[100px] bg-primary-500" />
            <span className="text-primary-500 font-medium text-[1.5rem] leading-12 ">
              {t("date_time")}
            </span>
            <div
              className={`w-[16.1rem] h-2 rounded-[100px] ${currentStep === 2 ? "bg-primary-500" : "bg-neutral-100"}`}
            />
            <span
              className={`${currentStep === 2 ? "text-primary-500" : "text-neutral-500"} font-medium text-[1.5rem] leading-12`}
            >
              {t("ticket")}
            </span>
          </div>
        </div>
      )}

      <form
        className=" flex flex-col gap-12 h-full overflow-y-scroll overflow-x-hidden"
        onSubmit={handleSubmit(processForm)}
      >
        {currentStep === 0 && (
          <motion.div
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            layout={false}
            className="flex flex-col gap-12"
          >
            <StepBasic
              register={register}
              control={control}
              errors={errors}
              imagePreview={imagePreview}
              handleFileChange={handleFileChange}
              // mapContainerRef={mapContainerRef}
              setValue={setValue}
              getValues={getValues}
              isPrivate={isPrivate}
              setIsPrivate={setIsPrivate}
              nameStatus={nameStatus}
            />
          </motion.div>
        )}

        {currentStep === 1 && (
          <motion.div
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-12"
          >
            <StepDateTime
              register={register}
              errors={errors}
              eventDays={eventDays as EventDay[]}
              setEventDays={
                setEventDays as React.Dispatch<React.SetStateAction<EventDay[]>>
              }
              setValue={setValue}
              t={(k) => t(k)}
              membershipTier={membershipTier}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-12"
          >
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
          </motion.div>
        )}
      </form>
    </div>
  );
}
