"use client";
import Image from "next/image";
import { Trash } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { compressImage } from "@/lib/compressImage";
import UploadDocument from "@/assets/icons/document-upload.svg";

/**
 * Optional picture for one raffle prize. Deliberately a compact square rather
 * than a copy of the cover dropzone: a prize sits in a list next to its
 * siblings, and a full-width well per prize would bury the fields.
 */
export default function PrizeImagePicker({
  preview,
  onSelect,
  onClear,
}: {
  preview: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  const t = useTranslations("Events.create_event");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Same reason as the cover: a phone photo blows the request limit on its own.
    onSelect(await compressImage(file));
    // Allow re-picking the same file after a clear.
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        <div className="relative w-28 h-28 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={t("prize_image")}
            className="w-28 h-28 object-cover rounded-[1rem] border border-neutral-200"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full z-40 opacity-0 cursor-pointer"
          />
          <button
            type="button"
            onClick={onClear}
            aria-label={t("prize_image_remove")}
            className="absolute -top-2 -right-2 z-50 w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center cursor-pointer"
          >
            <Trash variant="Bulk" color="#DE0028" size={14} />
          </button>
        </div>
      ) : (
        <div className="relative w-28 h-28 shrink-0 rounded-[1rem] border border-dashed border-[#e5e5e5] bg-[#FBFBFB] flex items-center justify-center">
          <Image src={UploadDocument} alt="" width={20} height={20} />
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full z-50 opacity-0 cursor-pointer"
          />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-[1.3rem] font-medium text-deep-100 leading-6">
          {t("prize_image")}
        </span>
        <span className="text-[1.2rem] text-neutral-500 leading-6">
          {t("prize_image_tip")}
        </span>
      </div>
    </div>
  );
}
