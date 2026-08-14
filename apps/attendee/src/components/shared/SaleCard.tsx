"use client";
import { DocumentDownload, DocumentText } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { PublicSale } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import { Link } from "@/i18n/navigation";
import { fileKind, formatFileSize } from "@/lib/saleFile";
import { slugify } from "@/lib/Slugify";

function SaleCard({ sale }: { sale: PublicSale }) {
  const locale = useLocale();
  const t = useTranslations("Event");

  return (
    <Link
      href={`/explore/sale/${slugify(sale.title, sale.saleId)}`}
      className="flex flex-row items-center lg:items-stretch lg:mb-8 lg:ml-4 lg:flex-col gap-4 w-full lg:max-w-140 bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 pl-4 lg:pl-0"
    >
      <div className="relative">
        {sale.coverImageUrl && (
          <Image
            src={sale.coverImageUrl}
            className="h-62 lg:max-h-[19.1rem] flex-1 lg:flex-auto w-62 lg:w-full object-cover object-top-left rounded-[10px]"
            alt={sale.title}
            height={191}
            width={255}
          />
        )}
        <div className="bg-primary-50 block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-6 w-fit">
          {t("saleCard.tag").toUpperCase()}
        </div>
      </div>

      <div className="px-4 flex flex-1 lg:flex-auto min-w-0 flex-col gap-6 lg:gap-4">
        {sale.activityTags?.length > 0 && (
          <ul className="hidden lg:flex gap-2 text-primary-500 font-medium">
            {sale.activityTags.map((tag, key) => (
              <li key={key}>#{tag}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-col w-full gap-1">
          <h1 className="font-bold w-full truncate font-primary text-[1.2rem] text-deep-100 leading-[1.7rem]">
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
          {sale.file && (
            <div className="flex items-center gap-2">
              <DocumentText size="15" color="#2e3237" variant="Bulk" />
              <span className="font-medium text-[1rem] text-deep-100 leading-6">
                {fileKind(sale.file.originalFilename, sale.file.mimeType)} ·{" "}
                {formatFileSize(sale.file.byteSize)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <DocumentDownload size="15" color="#2e3237" variant="Bulk" />
            <p className="font-medium text-[1rem] text-deep-100 leading-6">
              {t("saleCard.instant")}
            </p>
          </div>
        </div>

        {/* The all-in number, never itemised. `pricing.buyerPays` already
            includes the surcharge; showing `sale.price` here would quote a
            figure nobody can actually pay. */}
        <p className="font-bold text-[1.2rem] leading-6 text-primary-500">
          {formatMoney(sale.pricing.buyerPays, sale.pricing.currency, locale)}
        </p>
      </div>
    </Link>
  );
}

export default SaleCard;
