"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Camera, TickCircle, Warning2 } from "iconsax-reactjs";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { pillActionClass } from "@/components/auth/AuthParts";
import type { UploadState } from "@/components/auth/KycUploadTile";
import { KYC_PHOTO_ACCEPT } from "@/lib/kyc";
import { cn } from "@/lib/utils";

type CameraState = "off" | "starting" | "live" | "denied" | "unavailable";

/**
 * KYC selfie: the face only, taken live with the camera. Upload is offered
 * only when the camera is blocked or missing (e.g. a desktop without a
 * webcam); on phones that picker opens the front camera too.
 */
export default function KycSelfieCapture({
  label,
  hint,
  state,
  onCapture,
}: {
  label: string;
  hint: string;
  state: UploadState;
  onCapture: (file: File) => void;
}) {
  const t = useTranslations("Auth.kyc.selfie");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const upload = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState<CameraState>("off");
  const [preview, setPreview] = useState<string | null>(null);

  /**
   * Ref callback: the live view mounts only after the idle box has animated
   * out, which can be after the stream is ready, so the stream is attached
   * whenever the element appears — and the view is scrolled into reach.
   */
  function attachVideo(el: HTMLVideoElement | null) {
    video.current = el;
    if (!el || !stream.current || el.srcObject === stream.current) return;
    el.srcObject = stream.current;
    void el.play().catch(() => {});
    el.closest("[data-selfie-live]")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function stop() {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }

  useEffect(() => stop, []);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function open() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera("unavailable");
      return;
    }
    setCamera("starting");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setCamera("live");
      // In case the <video> is already mounted (otherwise attachVideo does it).
      if (video.current) attachVideo(video.current);
    } catch (error) {
      const name = (error as DOMException)?.name;
      setCamera(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
    }
  }

  function take() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    // Saved as the camera sees it (not mirrored), like any photo.
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stop();
        setCamera("off");
        const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
        setPreview(URL.createObjectURL(file));
        onCapture(file);
      },
      "image/jpeg",
      0.9,
    );
  }

  function picked(file: File) {
    setPreview(URL.createObjectURL(file));
    onCapture(file);
  }

  const hasPhoto = state.status !== "idle" && preview;
  const cameraBlocked = camera === "denied" || camera === "unavailable";

  return (
    <div className="flex flex-col gap-3 w-full">
      <span className="font-medium text-[1.5rem] leading-8 text-deep-100 px-2">{label}</span>
      <input
        ref={upload}
        type="file"
        accept={KYC_PHOTO_ACCEPT}
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) picked(file);
          e.target.value = "";
        }}
      />

      <AnimatePresence mode="wait" initial={false}>
        {camera === "live" || camera === "starting" ? (
          <motion.div
            key="live"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            data-selfie-live
            className="flex flex-col gap-6 items-center"
          >
            <div className="relative w-full max-w-[28rem] aspect-[4/5] rounded-[2.4rem] overflow-hidden bg-black">
              <video
                ref={attachVideo}
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              {/* Face guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-[62%] aspect-[3/4] rounded-[50%] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
              {camera === "starting" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[1.4rem] gap-3">
                  <LoadingCircleSmall />
                  {t("starting")}
                </div>
              )}
            </div>
            <p className="text-[1.3rem] text-neutral-600 text-center">{hint}</p>
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => {
                  stop();
                  setCamera("off");
                }}
                className={cn(pillActionClass, "h-[5.5rem] flex-1")}
              >
                {t("cancel")}
              </button>
              <ButtonPrimary
                type="button"
                onClick={take}
                disabled={camera !== "live"}
                className="flex-[2] h-[5.5rem]"
              >
                <span className="flex items-center gap-3 justify-center">
                  <Camera size={20} variant="Bulk" color="currentColor" />
                  {t("take")}
                </span>
              </ButtonPrimary>
            </div>
          </motion.div>
        ) : hasPhoto ? (
          <motion.div
            key="photo"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              "flex items-center gap-6 p-4 pr-6 rounded-[2rem] border bg-white",
              state.status === "error" ? "border-failure" : "border-neutral-100",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview!} alt="" className="w-[6.4rem] h-[6.4rem] rounded-full object-cover shrink-0" />
            <span className="flex-1 min-w-0 text-[1.3rem] flex items-center gap-2">
              {state.status === "uploading" && (
                <span className="text-neutral-500 flex items-center gap-2">
                  <LoadingCircleSmall /> {t("uploading")}
                </span>
              )}
              {state.status === "done" && (
                <span className="text-success flex items-center gap-2">
                  <TickCircle size={16} variant="Bold" color="currentColor" /> {t("done")}
                </span>
              )}
              {state.status === "error" && (
                <span className="text-failure flex items-center gap-2">
                  <Warning2 size={16} variant="Bold" color="currentColor" /> {state.message}
                </span>
              )}
            </span>
            {state.status !== "uploading" && (
              <button
                type="button"
                onClick={cameraBlocked ? () => upload.current?.click() : open}
                className="text-[1.4rem] font-medium text-primary-500 hover:underline shrink-0"
              >
                {t("retake")}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="py-10 px-6 rounded-[2rem] border border-[#e5e5e5] border-dashed bg-[#FBFBFB] flex flex-col items-center gap-5 text-center"
          >
            <span className="w-[5.6rem] h-[5.6rem] rounded-full bg-primary-50 flex items-center justify-center">
              <Camera size={26} variant="Bulk" color="#E45B00" />
            </span>
            <p className="text-[1.3rem] text-neutral-700 max-w-[32rem]">{hint}</p>
            {cameraBlocked && (
              <p role="alert" className="text-[1.3rem] text-failure max-w-[34rem]">
                {camera === "denied" ? t("denied") : t("unavailable")}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <ButtonPrimary type="button" onClick={open} className="h-[5rem] px-10">
                {cameraBlocked ? t("retry") : t("open")}
              </ButtonPrimary>
              {cameraBlocked && (
                <button
                  type="button"
                  onClick={() => upload.current?.click()}
                  className={cn(pillActionClass, "h-[5rem]")}
                >
                  {t("upload")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
