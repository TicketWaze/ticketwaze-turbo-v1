"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { DocumentDownload, DocumentText, Danger } from "iconsax-reactjs";
import { PublicSale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { fileKind, formatFileSize } from "@/lib/saleFile";

/**
 * STEP 1 — WHAT YOU ARE BUYING.
 *
 * The equivalent of the event flow's ticket-selection step, except there is
 * nothing to select: one file, one price, no quantity and no sales window. So
 * the step's whole job is to describe goods the buyer cannot open before
 * paying — the type, the size, and the fact that it downloads immediately are
 * the only things they can judge it by.
 */
export default function ProductStep({
  delta,
  sale,
}: {
  delta: number;
  sale: PublicSale;
}) {
  const t = useTranslations("Sale");
  const locale = useLocale();

  return (
    <motion.div
      initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col gap-8 lg:h-full lg:min-h-0 lg:overflow-y-auto"
    >
      <div className="flex items-center gap-6 rounded-[15px] border border-neutral-100 p-6">
        {sale.coverImageUrl && (
          <Image
            src={sale.coverImageUrl}
            alt={sale.title}
            width={88}
            height={88}
            className="rounded-[10px] object-cover w-[88px] h-[88px] shrink-0"
          />
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-semibold text-[1.7rem] leading-8 text-deep-100 truncate">
            {sale.title}
          </span>
          <span className="font-primary font-medium text-[2rem] leading-10 text-primary-500">
            {formatMoney(sale.pricing.buyerPays, sale.pricing.currency, locale)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 rounded-[15px] border border-neutral-100 p-6">
        <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
          {t("whatYouGet")}
        </span>

        {sale.file && (
          <div className="flex items-center gap-4">
            <DocumentText
              size="20"
              color="#2e3237"
              variant="Bulk"
              className="shrink-0"
            />
            <span className="text-[1.5rem] leading-8 text-neutral-700">
              {fileKind(sale.file.originalFilename, sale.file.mimeType)}
              {" · "}
              {formatFileSize(sale.file.byteSize)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <DocumentDownload
            size="20"
            color="#2e3237"
            variant="Bulk"
            className="shrink-0"
          />
          <span className="text-[1.5rem] leading-8 text-neutral-700">
            {t("instantDownload")}
          </span>
        </div>
      </div>

      {/* Stated before the payment steps, not after. A digital file cannot be
          returned, and that is the one term a buyer has to know up front. */}
      <div className="flex items-start gap-4 rounded-[15px] bg-neutral-100 p-6">
        <Danger
          size="20"
          color="#737C8A"
          variant="Bulk"
          className="shrink-0 mt-1"
        />
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-[1.5rem] leading-8 text-deep-100">
            {t("finalSale")}
          </span>
          <span className="text-[1.4rem] leading-8 text-neutral-600">
            {t("finalSaleNote")}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
