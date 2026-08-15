"use client";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { PublicSale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { fileKind, formatFileSize } from "@/lib/saleFile";

/**
 * WHAT IS BEING BOUGHT, visible at every step.
 *
 * The product counterpart of `TicketSummaryCard`: it sits in the desktop
 * sidebar for the whole flow so the price and the goods never leave the screen
 * while the buyer is choosing how to pay.
 *
 * The total is ONE number and is never itemised. The platform's surcharge is
 * not a line item to a buyer (SALE-MODULE.md §6), and `pricing.buyerPays` is
 * computed by the API — nothing here recalculates it.
 */
export default function SaleSummaryCard({
  sale,
  recipientName,
}: {
  sale: PublicSale;
  /** Set once a gift recipient has been confirmed, so the card can say so. */
  recipientName?: string | null;
}) {
  const t = useTranslations("Sale");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-6 rounded-[15px] border border-neutral-100 p-6 w-full">
      <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
        {t("summaryTitle")}
      </span>

      <div className="flex items-center gap-6">
        {sale.coverImageUrl && (
          <Image
            src={sale.coverImageUrl}
            alt={sale.title}
            width={72}
            height={72}
            className="rounded-[10px] object-cover w-[72px] h-[72px] shrink-0"
          />
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-semibold text-[1.5rem] leading-8 text-deep-100 truncate">
            {sale.title}
          </span>
          {sale.file && (
            <span className="text-[1.3rem] leading-7 text-neutral-600">
              {fileKind(sale.file.originalFilename, sale.file.mimeType)}
              {" · "}
              {formatFileSize(sale.file.byteSize)}
            </span>
          )}
        </div>
      </div>

      {/* Only once the recipient is confirmed. A half-typed address on this
          card would claim a delivery that has not been checked yet. */}
      {recipientName && (
        <div className="flex items-start justify-between gap-4 border-t border-neutral-100 pt-6">
          <span className="text-[1.4rem] leading-8 text-neutral-600">
            {t("gift.summaryFor")}
          </span>
          <span className="text-[1.4rem] leading-8 text-deep-100 text-right">
            {recipientName}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-neutral-100 pt-6">
        <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
          {t("total")}
        </span>
        <span className="font-primary font-medium text-[2.2rem] leading-10 text-primary-500">
          {formatMoney(sale.pricing.buyerPays, sale.pricing.currency, locale)}
        </span>
      </div>

      {/* The one term a buyer of a digital file has to know before paying. It
          left the product page, but it belongs here, at the moment of paying. */}
      <span className="text-[1.3rem] leading-7 text-neutral-600">
        {t("finalSaleNote")}
      </span>
    </div>
  );
}
