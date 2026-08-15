"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Sale } from "@ticketwaze/typescript-config";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import SaleFilePicker from "@/components/shared/SaleFilePicker";
import { formatFileSize } from "@/components/shared/SaleCard";
import { uploadSaleFile } from "@/lib/uploadSaleFile";

/**
 * The current file, and the way to replace it.
 *
 * Replacing is deliberately not quiet: a new version sends the product back
 * through review, because swapping the object underneath an approved listing is
 * the obvious way to get an unreviewed file past the gate. The panel says so
 * before the seller picks anything.
 */
export default function SaleFileManager({ sale }: { sale: Sale }) {
  const t = useTranslations("Sales.single_sale.file");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();

  const current = sale.files?.find((f) => f.isCurrent) ?? sale.files?.[0];
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [percent, setPercent] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) {
      setError(t("choose_first"));
      return;
    }
    setBusy(true);
    setPercent(0);
    try {
      const result = await uploadSaleFile({
        organisationId: sale.organisationId,
        saleId: sale.saleId,
        accessToken: session?.user.accessToken ?? "",
        locale,
        file,
        onProgress: setPercent,
      });
      if (result.status !== "success") {
        toast.error(result.message);
        return;
      }
      toast.success(t("upload_success"));
      setFile(null);
      // The status moved to `scanning` server-side; re-read rather than guess.
      router.refresh();
    } finally {
      setBusy(false);
      setPercent(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {current ? (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-[15px] border border-neutral-100 p-6">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-[1.6rem] font-medium leading-8 text-deep-100 truncate">
              {current.originalFilename}
            </p>
            <p className="text-[1.3rem] leading-6 text-neutral-600">
              {formatFileSize(current.byteSize)} · {current.mimeType} ·{" "}
              {t("version", { version: current.version })}
            </p>
          </div>
          <span className="text-[1.3rem] leading-6 text-neutral-600 shrink-0">
            {t(`scan.${current.scanStatus}`)}
          </span>
        </div>
      ) : (
        <p className="text-[1.5rem] leading-8 text-neutral-600">
          {t("none_yet")}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <span className="text-[1.4rem] font-medium text-neutral-700">
          {current ? t("replace") : t("add")}
        </span>
        <SaleFilePicker
          file={file}
          onSelect={(picked) => {
            setFile(picked);
            setError("");
          }}
          onClear={() => setFile(null)}
          error={error}
          uploadPercent={percent}
        />
        {current && (
          <p className="text-[1.2rem] leading-7 text-neutral-600">
            {t("replace_warning")}
          </p>
        )}
        {file && (
          <ButtonPrimary
            type="button"
            onClick={upload}
            disabled={busy}
            className="w-full lg:w-fit"
          >
            {busy ? <LoadingCircleSmall /> : t("upload_cta")}
          </ButtonPrimary>
        )}
      </div>
    </div>
  );
}
