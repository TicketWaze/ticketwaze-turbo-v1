"use client";
import { AddArtist, RemoveArtist } from "@/actions/EventActions";
import { usePathname } from "@/i18n/navigation";
import getCroppedImg from "@/lib/GetCroppedImage";
import { zodResolver } from "@hookform/resolvers/zod";
import { Event, EventPerformer, User } from "@ticketwaze/typescript-config";
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
import { Image as ImageIcon, Trash } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import React, { useCallback, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PageLoader from "@/components/PageLoader";
import { Input } from "@/components/shared/Inputs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

const httpsUrlRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/\S*)?$/;

export default function EventArtist({
  event,
  user,
  eventPerformers,
}: {
  event: Event;
  user: User;
  eventPerformers: EventPerformer[];
}) {
  const t = useTranslations("Events.single_event.artist");
  const closeRef = useRef<HTMLButtonElement>(null);
  const AddArtistSchema = z.object({
    performerName: z.string().min(1, t("errors.name")).max(50),
    performerLink: z
      .string()
      .min(1, "Link is required")
      .regex(httpsUrlRegex, "Please enter a valid HTTPS link (https://...)"),
    performerImage: z
      .file({
        error: (issue) =>
          issue.input === undefined
            ? t("errors.image.required")
            : t("errors.image.required"),
      })
      .max(504800, t("errors.image.max"))
      .mime(["image/jpeg", "image/jpg", "image/png", "image/webp"]),
  });
  type TAddArtistSchema = z.infer<typeof AddArtistSchema>;
  const {
    handleSubmit,
    setValue,
    register,
    formState: { isSubmitting, errors },
  } = useForm<TAddArtistSchema>({
    resolver: zodResolver(AddArtistSchema),
  });
  const pathname = usePathname();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  async function submitHandler(data: TAddArtistSchema) {
    const formData = new FormData();
    formData.append("performerName", data.performerName);
    formData.append("performerLink", data.performerLink);
    formData.append("performerImage", data.performerImage);
    const result = await AddArtist(
      event.eventId,
      user.accessToken,
      pathname,
      formData,
      locale,
    );
    if (result.status === "success") {
      toast.success("success");
      closeRef.current?.click();
    } else {
      toast.error(result.error);
    }
  }
  async function removeArtistFunction(eventPerformerId: string) {
    setIsLoading(true);
    const result = await RemoveArtist(
      event.eventId,
      eventPerformerId,
      user.accessToken,
      pathname,
      locale,
    );
    if (result.status === "success") {
      toast.success("Success");
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  }
  // Image handling
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
    setValue("performerImage", file, { shouldValidate: true });
    setImagePreview(URL.createObjectURL(file));
  }
  return (
    <div className="flex flex-col gap-4">
      <PageLoader isLoading={isLoading} />
      <Dialog>
        <div className="w-full flex justify-between">
          <div></div>
          <DialogTrigger>
            <span
              className={
                "text-primary-500 justify-end flex gap-4 cursor-pointer items-center text-[1.5rem] leading-[20px]"
              }
            >
              {t("add")}
            </span>
          </DialogTrigger>
        </div>
        <DialogContent className={"w-[360px] lg:w-[520px] "}>
          <DialogHeader>
            <DialogTitle
              className={
                "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
              }
            >
              {t("add")}
            </DialogTitle>
            <DialogDescription className={"sr-only"}>
              <span>Add artist</span>
            </DialogDescription>
          </DialogHeader>
          <div
            className={
              "flex flex-col w-auto justify-center items-center gap-[30px]"
            }
          >
            <div className="w-full flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-3">
                {imagePreview ? (
                  <div className="relative w-[120px] h-[120px]">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-[120px] h-[120px] object-cover object-top rounded-full"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="h-[120px] w-[120px] px-8 rounded-full border border-[#e5e5e5] border-dashed bg-[#FBFBFB] flex items-center justify-center relative">
                    <div className="flex flex-col items-center gap-4 ">
                      <ImageIcon size="16" color="#e45b00" variant="Bulk" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
                <span className="text-[1.2rem] px-8 py-2 text-failure">
                  {errors.performerImage?.message}
                </span>
              </div>
              <Input
                {...register("performerName")}
                className="w-full"
                error={errors.performerName?.message}
              >
                {t("name")}
              </Input>
              <Input
                className="w-full"
                {...register("performerLink")}
                error={errors.performerLink?.message}
              >
                {t("link")}
              </Input>
            </div>
          </div>
          <DialogFooter>
            <ButtonPrimary
              onClick={handleSubmit(submitHandler)}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? <LoadingCircleSmall /> : t("add")}
            </ButtonPrimary>
            <DialogClose ref={closeRef} className="sr-only"></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {eventPerformers.length > 0 ? (
        <ul className="flex items-center gap-8 overflow-x-auto scroll-smooth scrollbar-hide px-4 py-2">
          {eventPerformers.map((eventPerformer) => (
            <li
              key={eventPerformer.eventPerformerId}
              className="flex items-center justify-center w-[120px] h-[120px] overflow-hidden rounded-full flex-shrink-0"
            >
              <Popover>
                <PopoverTrigger>
                  <Image
                    src={eventPerformer.performerProfileUrl}
                    width={120}
                    height={120}
                    loading="eager"
                    alt={eventPerformer.performerName}
                    className="cursor-pointer"
                  />
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  className={
                    "w-[50px] p-0 m-0 bg-none cursor-pointer shadow-none border-none -mx-8 -mb-12"
                  }
                >
                  <Trash
                    size="32"
                    variant="Bulk"
                    color={"#DE0028"}
                    onClick={() =>
                      removeArtistFunction(eventPerformer.eventPerformerId)
                    }
                  />
                </PopoverContent>
              </Popover>
            </li>
          ))}
        </ul>
      ) : (
        <div className="w-full text-center">
          <span
            className={
              "text-[1.8rem] text-center leading-[25px] text-neutral-600"
            }
          >
            {t("noArtist")}
          </span>
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
    </div>
  );
}
