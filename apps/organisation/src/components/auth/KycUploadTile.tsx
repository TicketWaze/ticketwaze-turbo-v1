"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { DocumentText, TickCircle, Warning2 } from "iconsax-reactjs";
import UploadDocument from "@/assets/icons/document-upload.svg";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { cn } from "@/lib/utils";

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; file: File }
  | { status: "done"; file: File; key: string }
  | { status: "error"; file?: File; message: string };

/**
 * One KYC document: the app's dashed upload box (as in Create Activity), then
 * a preview row once the file is in the private bucket. Uploads start as soon
 * as a file is picked, so "Submit" only has keys to send.
 */
export default function KycUploadTile({
  label,
  hint,
  formats,
  accept,
  optional = false,
  state,
  onPick,
}: {
  label: string;
  /** What the document must show (e.g. the selfie's pose); optional. */
  hint?: string;
  /** Accepted formats and size. */
  formats: string;
  accept: string;
  optional?: boolean;
  state: UploadState;
  onPick: (file: File) => void;
}) {
  const t = useTranslations("Auth.kyc.upload");
  const input = useRef<HTMLInputElement>(null);
  const file = state.status === "idle" ? undefined : state.file;
  const isImage = Boolean(file?.type.startsWith("image/"));
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !isImage) return;
    const url = URL.createObjectURL(file);
    // Object URLs are external resources; revoking on change is the cleanup.
    setPreview(url); // eslint-disable-line react-hooks/set-state-in-effect
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  const picker = (
    <input
      ref={input}
      type="file"
      accept={accept}
      className="hidden"
      onChange={(e) => {
        const picked = e.target.files?.[0];
        if (picked) onPick(picked);
        e.target.value = "";
      }}
    />
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-baseline justify-between gap-4 px-2">
        <span className="font-medium text-[1.5rem] leading-8 text-deep-100">
          {label}
        </span>
        {optional && (
          <span className="text-[1.3rem] text-neutral-500">{t("optional")}</span>
        )}
      </div>
      {picker}
      <AnimatePresence mode="wait" initial={false}>
        {state.status === "idle" ? (
          <motion.button
            key="idle"
            type="button"
            onClick={() => input.current?.click()}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="py-10 px-6 rounded-[2rem] border border-[#e5e5e5] border-dashed bg-[#FBFBFB] hover:border-primary-300 transition-colors flex flex-col items-center gap-4 cursor-pointer"
          >
            <Image src={UploadDocument} alt="" width={24} height={24} />
            <span className="text-[1.5rem] leading-6 text-neutral-500 text-center">
              {t("cta")}{" "}
              <span className="font-medium text-primary-500">{t("browse")}</span>
            </span>
            {hint && (
              <span className="text-[1.3rem] text-neutral-700 text-center">{hint}</span>
            )}
            <span className="text-[1.2rem] text-neutral-500">{formats}</span>
          </motion.button>
        ) : (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn(
              "flex items-center gap-6 p-4 pr-6 rounded-[2rem] border bg-white",
              state.status === "error" ? "border-failure" : "border-neutral-100",
            )}
          >
            <span className="w-[6.4rem] h-[6.4rem] rounded-[1.4rem] overflow-hidden bg-neutral-100 flex items-center justify-center shrink-0">
              {isImage && preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <DocumentText size={28} variant="Bulk" color="#E45B00" />
              )}
            </span>
            <span className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="text-[1.4rem] leading-7 text-deep-100 truncate">
                {file?.name ?? label}
              </span>
              <span
                className={cn(
                  "text-[1.2rem] leading-6 flex items-center gap-2",
                  state.status === "error"
                    ? "text-failure"
                    : state.status === "done"
                      ? "text-success"
                      : "text-neutral-500",
                )}
              >
                {state.status === "uploading" && t("uploading")}
                {state.status === "done" && (
                  <>
                    <TickCircle size={14} variant="Bold" color="currentColor" />
                    {t("uploaded")}
                  </>
                )}
                {state.status === "error" && (
                  <>
                    <Warning2 size={14} variant="Bold" color="currentColor" />
                    {state.message}
                  </>
                )}
              </span>
            </span>
            {state.status === "uploading" ? (
              <LoadingCircleSmall />
            ) : (
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="text-[1.4rem] font-medium text-primary-500 hover:underline shrink-0"
              >
                {state.status === "error" ? t("retry") : t("replace")}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
