"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { motion } from "framer-motion";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { UpdatePrivateEvent } from "@/actions/EventActions";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import StepBasic from "./BasicDetails";
import StepDateTime from "./EventDays";
import StepTicket from "./TicketClasses";
import { EditPrivateSchema } from "./schema";
import { Event } from "@ticketwaze/typescript-config";
import Slugify from "@/lib/Slugify";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import BackButton from "@/components/shared/BackButton";

export default function EditPrivateEventForm({ event }: { event: Event }) {
  const t = useTranslations("Events.create_event");
  const locale = useLocale();
  const { data: session } = useSession();
  const organisation = session?.activeOrganisation;
  const [isFree, setIsfree] = useState(
    (event.eventTicketTypes[0]?.ticketTypePrice ?? 0) < 1,
  );
  const [isRefundable, setIsRefundable] = useState(
    event.eventTicketTypes[0]?.isRefundable ?? false,
  );

  // create schema using factory (depends on isFree)
  const FormDataSchema = EditPrivateSchema(isFree, (k: string) => t(k));
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
        "longitude",
        "latitude",
        "eventTagId",
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
    formState: { errors, isSubmitting },
  } = useForm<TForm>({
    resolver: zodResolver(FormDataSchema),
    values: {
      eventName: event.eventName,
      eventDescription: event.eventDescription,
      address: event.address,
      state: event.state,
      city: event.city,
      country: event.country,
      longitude: event.longitude,
      latitude: event.latitude,
      eventTagId: event.eventTagId,
      eventImage: undefined as unknown as File,
      eventDays: event.eventDays.map((eventDay) => {
        const formatLocalDateTime = (date: string | Date) => {
          const d = new Date(date);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        return {
          startTime: formatLocalDateTime(eventDay.startDate),
          endTime: formatLocalDateTime(eventDay.endTime),
        };
      }),
      ticketTypes: event.eventTicketTypes.map((ticketType) => ({
        ticketTypeDescription: ticketType.ticketTypeDescription,
        ticketTypeName: ticketType.ticketTypeName,
        ticketTypePrice:
          event.currency === "USD"
            ? String(ticketType.usdPrice)
            : String(ticketType.ticketTypePrice),
        ticketTypeQuantity: String(ticketType.ticketTypeQuantity),
      })),
      eventCurrency: event.currency,
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
    formData.append("longitude", data.longitude);
    formData.append("latitude", data.latitude);
    formData.append("eventTagId", data.eventTagId);
    formData.append("eventImage", data.eventImage);
    formData.append("eventDays", JSON.stringify(data.eventDays));
    formData.append("eventCurrency", data.eventCurrency);
    formData.append("isRefundable", JSON.stringify(isRefundable));
    if (isFree) {
      formData.append(
        "ticketTypes",
        JSON.stringify([
          {
            ticketTypeName: "general",
            ticketTypeDescription: t("general_default"),
            ticketTypePrice: "",
            ticketTypeQuantity: "100",
          },
        ]),
      );
    } else {
      formData.append("ticketTypes", JSON.stringify(data.ticketTypes));
    }

    const result = await UpdatePrivateEvent(
      organisation?.organisationId ?? "",
      session?.user.accessToken ?? "",
      formData,
      locale,
      event.eventId,
    );
    if (result.status === "success") {
      toast.success("success");
      redirect(`/events/show/${Slugify(result.event.eventName)}`);
    }
    if (result.error) toast.error(result.error);
  };

  type FieldName = keyof TForm;

  const next = async () => {
    const fields = steps[currentStep]?.fields;
    const output = await trigger(fields as FieldName[], { shouldFocus: true });
    if (!output) return;
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
  const [imagePreview, setImagePreview] = useState<string>(event.eventImageUrl);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    const loadExistingImage = async () => {
      if (event.eventImageUrl) {
        try {
          const response = await fetch(event.eventImageUrl);
          const blob = await response.blob();
          const file = new File([blob], "event-image.jpg", {
            type: blob.type || "image/jpeg",
          });
          setValue("eventImage", file, { shouldValidate: true });
        } catch (error) {
          console.error("Failed to load existing image:", error);
        }
      }
    };

    loadExistingImage();
  }, [event.eventImageUrl, setValue]);

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

  // eventDays + ticketClasses local state (for dynamic add/remove UI)
  const [eventDays, setEventDays] = useState<
    { startTime: string; endTime: string }[]
  >(
    event.eventDays.map((eventDay) => {
      const formatLocalDateTime = (date: string | Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      return {
        startTime: formatLocalDateTime(eventDay.startDate),
        endTime: formatLocalDateTime(eventDay.endTime),
      };
    }),
  );
  const [ticketClasses, setTicketClasses] = useState<
    {
      ticketTypeName: string;
      ticketTypeDescription: string;
      ticketTypePrice: string;
      ticketTypeQuantity: string;
    }[]
  >(
    event.eventTicketTypes.map((ticketType) => {
      return {
        ticketTypeDescription: ticketType.ticketTypeDescription,
        ticketTypeName: ticketType.ticketTypeName,
        ticketTypePrice:
          event.currency === "USD"
            ? String(ticketType.usdPrice)
            : String(ticketType.ticketTypePrice),
        ticketTypeQuantity: String(ticketType.ticketTypeQuantity),
      };
    }),
  );

  // MAP
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const position: [number, number] = [-72.2852, 18.9712];

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_TOKEN ?? "";
    mapRef.current = new mapboxgl.Map({
      // @ts-ignore
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: position,
      zoom: 6,
      attributionControl: false,
    });
    if (markerRef.current) {
      markerRef.current.setLngLat([
        Number(event.longitude),
        Number(event.latitude),
      ]);
    } else {
      markerRef.current = new mapboxgl.Marker({ color: "red" })
        .setLngLat([Number(event.longitude), Number(event.latitude)])
        .addTo(mapRef.current!);
    }

    mapRef.current.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setValue("longitude", String(lng));
      setValue("latitude", String(lat));
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker({ color: "red" })
          .setLngLat([lng, lat])
          .addTo(mapRef.current!);
      }
    });
    // cleanup on unmount
    return () => {
      mapRef.current?.remove();
    };
  }, [setValue]);

  return (
    <div className="relative flex flex-col gap-8 overflow-hidden h-full ">
      <div className="absolute bottom-4 z-[9999] w-full hidden lg:block">
        <ButtonPrimary
          onClick={next}
          className=" w-full max-w-[530px] mx-auto  "
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoadingCircleSmall /> : t("proceed")}
        </ButtonPrimary>
      </div>

      <div className="fixed lg:hidden bottom-36 w-full px-8 z-50 left-0">
        <div className=" lg:hidden bg-white mx-auto border border-neutral-100 px-4 py-[5px] flex justify-between items-center rounded-[100px]">
          <div className="text-[2.2rem] text-neutral-600">
            <span className="text-primary-500">{currentStep + 1}</span>/3
          </div>
          <ButtonPrimary onClick={next}>
            {isSubmitting ? <LoadingCircleSmall /> : t("proceed")}
          </ButtonPrimary>
        </div>
      </div>

      {currentStep === 0 ? (
        <BackButton text={t("back")}>
          <div className="flex justify-between">
            <div className="hidden lg:flex items-center gap-4">
              <span className="text-primary-500 font-medium text-[1.5rem] leading-[3rem] ">
                {t("basic")}
              </span>
              <div className="w-[161px] h-[5px] rounded-[100px] bg-neutral-100" />
              <span className="text-neutral-500 font-medium text-[1.5rem] leading-[3rem] ">
                {t("date_time")}
              </span>
              <div className="w-[161px] h-[5px] rounded-[100px] bg-neutral-100" />
              <span className="text-neutral-500 font-medium text-[1.5rem] leading-[3rem] ">
                {t("ticket")}
              </span>
            </div>
          </div>
        </BackButton>
      ) : (
        <div className="flex items-center justify-between">
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
          <div className="hidden lg:flex items-center gap-4">
            <span className="text-primary-500 font-medium text-[1.5rem] leading-[3rem] ">
              {t("basic")}
            </span>
            <div className="w-[161px] h-[5px] rounded-[100px] bg-primary-500" />
            <span className="text-primary-500 font-medium text-[1.5rem] leading-[3rem] ">
              {t("date_time")}
            </span>
            <div
              className={`w-[161px] h-[5px] rounded-[100px] ${currentStep === 2 ? "bg-primary-500" : "bg-neutral-100"}`}
            />
            <span
              className={`${currentStep === 2 ? "text-primary-500" : "text-neutral-500"} font-medium text-[1.5rem] leading-[3rem]`}
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
              <div className="relative w-full h-[300px]">
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
              <span className="bg-primary-500 px-[3rem] py-[15px] border-2 border-transparent rounded-[100px] text-white font-medium text-[1.5rem] h-auto leading-[20px] cursor-pointer flex items-center justify-center w-full">
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
              mapContainerRef={mapContainerRef}
              setValue={setValue}
              event={event}
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
              eventDays={eventDays}
              setEventDays={setEventDays}
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
              event={event}
              register={register}
              errors={errors}
              ticketClasses={ticketClasses}
              setTicketClasses={setTicketClasses}
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
