"use client";
import { DocumentText, ArchiveBox } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Sale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";

/** Bytes as the seller thinks of them: MB, or GB once it stops being readable. */
export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * The badge colour for a sale's position in the review lifecycle.
 *
 * Shared with the detail page so a product never wears one colour in the list
 * and another on its own page.
 */
export function saleStatusClass(status: Sale["status"]): string {
  switch (status) {
    case "live":
      return "bg-success";
    case "rejected":
      return "bg-failure";
    case "scanning":
    case "pending_review":
      return "bg-warning";
    default:
      return "bg-neutral-900";
  }
}

function SaleCard({ sale }: { sale: Sale }) {
  const locale = useLocale();
  const t = useTranslations("Events");

  // Prices are stored in both currencies; the product is denominated in one.
  const sellerPrice = sale.currencyCode === "USD" ? sale.usdPrice : sale.price;
  // What the buyer is actually charged, which is the number a seller compares
  // against other listings. Derived by the API — never recomputed here.
  const buyerPays = sale.pricing?.buyerPays ?? sellerPrice;
  const file = sale.files?.find((f) => f.isCurrent) ?? sale.files?.[0];

  return (
    <Link
      href={`/events/sale/${slugify(sale.title, sale.saleId)}`}
      className="flex flex-row items-center lg:items-stretch lg:mb-8 lg:flex-col gap-4 w-full lg:max-w-140 bg-white shadow-lg rounded-2xl overflow-hidden pb-4 pl-4 lg:pl-0">
      <div className="relative">
        {sale.coverImageUrl && (
          <Image
            src={sale.coverImageUrl}
            className="h-62 lg:h-[19.1rem] flex-1 lg:flex-auto w-62 lg:w-full object-cover object-top-left rounded-2xl"
            alt={sale.title}
            height={191}
            width={255}
          />
        )}
        <div
          className={`${saleStatusClass(sale.status)} block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit`}>
          {t(`saleCard.status.${sale.status}`).toUpperCase()}
        </div>
        <div className="bg-primary-50 block absolute bottom-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-6 w-fit">
          {t("saleCard.tag").toUpperCase()}
        </div>
      </div>

      <div className="px-4 flex flex-1 lg:flex-auto min-w-0 flex-col gap-6 lg:gap-4">
        {sale.activityTags?.length > 0 && (
          <ul className="hidden lg:flex gap-2 text-primary-500 font-medium">
            {sale.activityTags.slice(0, 3).map((tag, key) => (
              <li key={key}>#{tag}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-col w-full gap-1">
          <h1 className="font-bold w-full truncate font-primary text-[1.2rem] text-deep-100 leading-6">
            {sale.title}
          </h1>
          {sale.activityTags?.length > 0 && (
            <ul className="flex gap-2 lg:hidden text-primary-500 font-medium">
              {sale.activityTags.slice(0, 2).map((tag, key) => (
                <li key={key}>#{tag}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <DocumentText size="15" color="#2e3237" variant="Bulk" />
            <p className="font-medium truncate text-[1rem] text-deep-100 leading-6">
              {/* A sale with no file cannot be reviewed, let alone sold, so the
                  missing case is worth naming rather than leaving blank. */}
              {file ? file.originalFilename : t("saleCard.no_file")}
            </p>
          </div>
          {file && (
            <div className="flex items-center gap-2">
              <ArchiveBox size="15" color="#2e3237" variant="Bulk" />
              <span className="font-medium text-[1rem] text-deep-100 leading-6">
                {formatFileSize(file.byteSize)}
              </span>
            </div>
          )}
        </div>
        <p className="font-bold text-[1.2rem] leading-6 text-primary-500">
          {formatMoney(buyerPays, sale.currencyCode, locale)}{" "}
          <span className="font-normal text-neutral-700">
            {t("saleCard.you_receive", {
              amount: formatMoney(sellerPrice, sale.currencyCode, locale),
            })}
          </span>
        </p>
      </div>
    </Link>
  );
}

export default SaleCard;
