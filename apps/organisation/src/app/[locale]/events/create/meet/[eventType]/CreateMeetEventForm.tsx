/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useCallback, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft2 } from "iconsax-reactjs";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/GetCroppedImage";
import { motion } from "motion/react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  CreateGoogleMeetEvent,
  ValidateBasicDetailsInPerson,
} from "@/actions/EventActions";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import StepBasic from "./BasicDetails";
import StepDateTime from "./EventDays";
import StepTicket from "./TicketClasses";
import { makeMeetPersonSchema } from "./schema";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import BackButton from "@/components/shared/BackButton";
import { EventDay } from "./types";

export default function CreateMeetEventForm({
  eventType,
  code,
}: {
  eventType: string;
  code: string | undefined;
}) {
  const t = useTranslations("Events.create_event");
  const locale = useLocale();
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const [isFree, setIsfree] = useState(false);
  const [isRefundable, setIsRefundable] = useState(false);

  // create schema using factory (depends on isFree)
  const FormDataSchema = makeMeetPersonSchema(isFree, (k: string) => t(k));
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
    control,
    trigger,
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
          ticketTypeName: session?.activeOrganisation.membershipTier
            .customTicketTypes
            ? ""
            : t("general.name"),
          ticketTypeDescription: session?.activeOrganisation.membershipTier
            .customTicketTypes
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
    formData.append("eventImage", data.eventImage);
    formData.append("eventDays", JSON.stringify(data.eventDays));
    formData.append("eventCurrency", data.eventCurrency);
    formData.append("eventType", eventType);
    formData.append("isFree", JSON.stringify(data.isFree));
    formData.append("activityTags", JSON.stringify(data.activityTags));
    formData.append("isRefundable", JSON.stringify(isRefundable));
    if (isFree) {
      formData.append(
        "ticketTypes",
        JSON.stringify([
          {
            ticketTypeName: "General",
            ticketTypeDescription: t("general_default"),
            ticketTypePrice: "",
            ticketTypeQuantity: String(
              session?.activeOrganisation.membershipTier.freeTickets,
            ),
          },
        ]),
      );
    } else {
      formData.append("ticketTypes", JSON.stringify(data.ticketTypes));
    }

    const result = await CreateGoogleMeetEvent(
      organisation?.organisationId ?? "",
      session?.user.accessToken ?? "",
      formData,
      locale,
      decodeURIComponent(code ?? ""),
    );
    if (result.status === "success") {
      toast.success("success");
      redirect("/events");
    }
    if (result.error) toast.error(result.error);
  };

  type FieldName = keyof TForm;

  const [isLoading, setIsLoading] = useState(false);

  const next = async () => {
    const fields = steps[currentStep]?.fields;
    const output = await trigger(fields as FieldName[], { shouldFocus: true });
    if (!output) return;
    if (currentStep === 0) {
      // validate basic details
      setIsLoading(true);
      const formData = new FormData();
      formData.append("eventName", getValues("eventName"));
      formData.append("eventDescription", getValues("eventDescription"));
      formData.append("address", getValues("address"));
      formData.append("state", getValues("state"));
      formData.append("city", getValues("city"));
      formData.append("country", getValues("country"));
      formData.append("eventImage", getValues("eventImage"));
      formData.append("eventType", eventType);
      formData.append(
        "activityTags",
        JSON.stringify(getValues("activityTags")),
      );
      const result = await ValidateBasicDetailsInPerson(
        organisation?.organisationId ?? "",
        session?.user.accessToken ?? "",
        formData,
        locale,
        "create",
      );
      if (result.status !== "success") {
        setIsLoading(false);
        toast.error(result.error);
        return;
      }
      setIsLoading(false);
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

  // Image handling (same as original)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback(
    (_: any, croppedPixels: any) => setCroppedAreaPixels(croppedPixels),
    [],
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerRef.current?.click();
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => setImageSrc(reader.result as string);
  };

  async function cropImage() {
    if (!imageSrc || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
    const file = new File([croppedBlob], "profile.jpg", {
      type: croppedBlob.type,
    });
    setValue("eventImage", file, { shouldValidate: true });
    setImagePreview(URL.createObjectURL(file));
  }

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
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? <LoadingCircleSmall /> : t("proceed")}
        </ButtonPrimary>
      </div>

      <div className="fixed lg:hidden bottom-36 w-full px-8 z-50 left-0">
        <div className=" lg:hidden bg-white mx-auto border border-neutral-100 px-4 py-2 flex justify-between items-center rounded-[100px]">
          <div className="text-[2.2rem] text-neutral-600">
            <span className="text-primary-500">{currentStep + 1}</span>/3
          </div>
          <ButtonPrimary onClick={next} disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? <LoadingCircleSmall /> : t("proceed")}
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

      <Dialog>
        <DialogTrigger asChild className="hidden">
          <span ref={triggerRef} className="hidden">
            open
          </span>
        </DialogTrigger>
        <DialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t("resize")}</DialogTitle>
            <DialogDescription className="sr-only">
              This action cannot be undone
            </DialogDescription>
            {imageSrc && (
              <div className="relative w-full h-120">
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
            )}
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild onClick={cropImage}>
              <span className="bg-primary-500 px-12 py-6 border-2 border-transparent rounded-[100px] text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer flex items-center justify-center w-full">
                {t("resize")}
              </span>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            />
          </motion.div>
        )}
      </form>
    </div>
  );
}
