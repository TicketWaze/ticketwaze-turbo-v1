"use client";
import Image from "next/image";
import { Trash } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import UploadDocument from "@/assets/icons/document-upload.svg";
import { formatFileSize } from "@/components/shared/SaleCard";

/**
 * Picks the file a sale sells.
 *
 * Nothing is compressed, re-encoded or even read here: unlike a cover image the
 * bytes ARE the product, and they go straight from this input to S3 with a
 * presigned PUT (see `lib/uploadSaleFile.ts`). The picker only holds the
 * `File` and shows the progress of that upload.
 */
export default function SaleFilePicker({
  file,
  onSelect,
  onClear,
  error,
  uploadPercent,
}: {
  file: File | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  error?: string;
  /** 0-100 while the PUT runs, null when idle. */
  uploadPercent?: number | null;
}) {
  const t = useTranslations("Events.create_event.sale");
  const uploading = uploadPercent !== null && uploadPercent !== undefined;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    onSelect(picked);
    // Allow re-picking the same file after a clear.
    e.target.value = "";
  }

  if (file) {
    return (
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-neutral-200 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-[1.4rem] font-medium text-deep-100 truncate">
              {file.name}
            </span>
            <span className="text-[1.2rem] text-neutral-500">
              {formatFileSize(file.size)}
            </span>
          </div>
          {/* Removing mid-upload would leave the progress bar describing a file
              that is no longer selected, so the button is gone while it runs. */}
          {!uploading && (
            <button
              type="button"
              onClick={onClear}
              aria-label={t("file_remove")}
              className="w-10 h-10 shrink-0 rounded-full bg-white border border-neutral-200 flex items-center justify-center cursor-pointer"
            >
              <Trash variant="Bulk" color="#DE0028" size={16} />
            </button>
          )}
        </div>

        {uploading && (
          <div className="flex flex-col gap-2">
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-200"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
            <span className="text-[1.2rem] text-neutral-600">
              {t("uploading", { percent: uploadPercent ?? 0 })}
            </span>
          </div>
        )}

        {error && <span className="text-[1.2rem] text-failure">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`py-16 px-[1.4rem] rounded-[7px] border border-dashed bg-[#FBFBFB] flex items-center justify-center relative ${
          error ? "border-failure" : "border-[#e5e5e5]"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <Image src={UploadDocument} alt="" width={24} height={24} />
          <p className="text-[1.5rem] leading-6 text-neutral-500 text-center">
            {t("file_text")}{" "}
            <span className="font-medium text-primary-500">{t("browse")}</span>
          </p>
        </div>
        <input
          type="file"
          onChange={handleChange}
          className="absolute top-0 left-0 w-full h-full z-50 opacity-0 cursor-pointer"
        />
      </div>
      {error && <span className="text-[1.2rem] text-failure">{error}</span>}
    </div>
  );
}
