"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { DocumentText, Lock1, Trash, Warning2 } from "iconsax-reactjs";
import UploadDocument from "@/assets/icons/document-upload.svg";

/**
 * The optional document attached to an online event.
 *
 * Shared by the create and edit forms so the two cannot drift — the rules it
 * shows (the size ceiling, the free-plan restriction) are the ones the API
 * enforces, and a second copy would eventually promise something different
 * from what the server does.
 *
 * The file is held in form state and uploaded AFTER the event is saved: the S3
 * key is scoped to the event id, which does not exist while the create form is
 * still being filled in.
 */

/** Bytes to a short human string. `1.4 MB`, not `1468006 bytes`. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

type Props = {
  /** The newly chosen file, not yet uploaded. */
  file: File | null;
  onChange: (file: File | null) => void;
  /**
   * The filename already stored against this event, on the edit form. Shown
   * until a replacement is chosen, at which point the new file takes over.
   */
  existingFilename?: string | null;
  existingByteSize?: number | null;
  /** Removes the STORED document. Absent on the create form, where none exists. */
  onRemoveExisting?: () => void;
  /** The plan ceiling, in MB. Used for both the hint and the local refusal. */
  maxFileMb: number;
  /**
   * True when this organisation may not attach a document at all — a free plan
   * running a free event. The field stays visible and explains why, rather than
   * vanishing, which would read as a missing feature rather than a decision.
   */
  locked: boolean;
  /** Set when the chosen file was refused locally, e.g. over the ceiling. */
  error?: string | null;
};

export default function EventDocumentField({
  file,
  onChange,
  existingFilename,
  existingByteSize,
  onRemoveExisting,
  maxFileMb,
  locked,
  error,
}: Props) {
  const t = useTranslations("Events.create_event.document");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null;
    onChange(chosen);
    // Let the same file be re-picked after a removal; without this the input
    // holds the old value and the change event never fires again.
    event.target.value = "";
  };

  const clear = () => {
    onChange(null);
    inputRef.current!.value = "";
  };

  const showing = file
    ? { name: file.name, size: file.size, stored: false }
    : existingFilename
      ? { name: existingFilename, size: existingByteSize ?? 0, stored: true }
      : null;

  return (
    <div className="max-w-216 w-full mx-auto p-6 rounded-[15px] flex flex-col gap-6 border border-neutral-100">
      <div className="flex flex-col gap-2">
        <span className="font-semibold text-[16px] leading-[2.2rem] text-deep-100">
          {t("title")}
        </span>
        <p className="text-[1.3rem] leading-6 text-neutral-600">
          {t("hint")}
        </p>
      </div>

      {locked ? (
        <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300 bg-[#FBFBFB]">
          <Lock1 size="24" color="#737C8A" variant="Bulk" />
          <p className="text-[1.3rem] leading-8 text-neutral-800">
            {t("lockedFreePlan")}
          </p>
        </div>
      ) : showing ? (
        <div className="flex items-center gap-4 px-6 py-6 rounded-[7px] border border-[#e5e5e5] bg-[#FBFBFB]">
          <DocumentText size="24" color="#E45B00" variant="Bulk" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[1.5rem] leading-6 text-deep-200 truncate">
              {showing.name}
            </span>
            <span className="text-[1.2rem] leading-6 text-neutral-600">
              {showing.size > 0 ? formatSize(showing.size) : t("stored")}
            </span>
          </div>
          <button
            type="button"
            aria-label={t("remove")}
            onClick={() => {
              if (showing.stored) {
                onRemoveExisting?.();
              } else {
                clear();
              }
            }}
            className="cursor-pointer shrink-0"
          >
            <Trash size="20" color="#DE0028" variant="Bulk" />
          </button>
        </div>
      ) : (
        <div className="py-24 px-[1.4rem] rounded-[7px] border border-[#e5e5e5] border-dashed bg-[#FBFBFB] flex items-center justify-center relative">
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-4 items-center">
              <Image src={UploadDocument} alt="upload" width={24} height={24} />
              <p className="text-[1.5rem] leading-6 text-neutral-500">
                {t("dropzone")}{" "}
                <span className="font-medium text-primary-500">
                  {t("browse")}
                </span>
              </p>
              <p className="text-[1.2rem] leading-6 text-neutral-600">
                {t("limit", { limit: maxFileMb })}
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              onChange={handleChange}
              className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
            />
          </div>
        </div>
      )}

      {error && (
        <span className="text-[1.2rem] px-8 py-2 text-failure">{error}</span>
      )}

      {!locked && (
        <div className="flex flex-col items-start gap-4 border p-4 rounded-2xl border-neutral-300">
          <Warning2 size="24" color="#737C8A" variant="Bulk" />
          <p className="text-[1.2rem] leading-8 text-neutral-800">
            {t("availabilityTip")}
          </p>
        </div>
      )}
    </div>
  );
}
