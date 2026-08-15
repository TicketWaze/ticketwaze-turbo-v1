"use client";
import { slugify } from "@/lib/Slugify";
import { Sale } from "@ticketwaze/typescript-config";
import {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DocumentText,
  Edit2,
  Layer,
  Money3,
  ShieldTick,
  Tag,
} from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { LinkPrimary } from "@/components/shared/Links";
import { formatMoney } from "@ticketwaze/currency";
import { formatFileSize } from "@/components/shared/SaleCard";
import FormatDate from "@/lib/FormatDate";

/**
 * THE PRODUCT'S OWN DETAILS, BEHIND "DETAILS" IN THE MORE MENU.
 *
 * The event page keeps its description, poster and schedule in a drawer rather
 * than on the page, so the page itself is the numbers and the list of who
 * bought. This is the same drawer for a digital product — the cover, the
 * description, and the facts that describe the thing rather than its sales.
 *
 * Mirrors `events/show/[slug]/components/EventDrawerContent.tsx` deliberately,
 * down to the spacing, so the two pages read as one dashboard.
 */
export default function SaleDrawerContent({ sale }: { sale: Sale }) {
  const t = useTranslations("Sales.single_sale");
  const locale = useLocale();

  const sellerPrice = sale.currencyCode === "USD" ? sale.usdPrice : sale.price;
  const buyerPays = sale.pricing?.buyerPays ?? sellerPrice;
  const current = sale.files?.find((f) => f.isCurrent) ?? sale.files?.[0];
  const versions = sale.files?.length ?? 0;

  return (
    <DrawerContent className={"my-6 p-6 lg:p-12 rounded-[30px] lg:w-[580px]"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black"
            }
          >
            {t("product_details")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {t("product_details")}
        </DrawerDescription>
        <div className={"w-full"}>
          <div className={"w-full gap-[30px] flex flex-col"}>
            {sale.coverImageUrl && (
              <div
                className={"w-full flex flex-col gap-[1.5rem] justify-start"}
              >
                <Image
                  alt={sale.title}
                  src={sale.coverImageUrl}
                  height={298}
                  width={520}
                  className={"rounded-[10px] h-[298px] object-cover object-top"}
                />
              </div>
            )}

            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <span
                className={
                  "font-primary text-deep-100 font-medium text-[1.8rem]"
                }
              >
                {t("about")}
              </span>
              <div
                className="rich-text text-[1.5rem] leading-8 text-neutral-700"
                // The seller's own rich text, rendered the way the event and
                // raffle drawers render theirs.
                dangerouslySetInnerHTML={{ __html: sale.description }}
              />
            </div>

            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <span
                className={
                  "font-primary text-deep-100 font-medium text-[1.8rem]"
                }
              >
                {t("product_details")}
              </span>

              <DetailRow icon={<Money3 size="20" color="#737c8a" variant="Bulk" />}>
                {t("drawer.price", {
                  buyer: formatMoney(buyerPays, sale.currencyCode, locale),
                  seller: formatMoney(sellerPrice, sale.currencyCode, locale),
                })}
              </DetailRow>

              {current && (
                <DetailRow
                  icon={
                    <DocumentText size="20" color="#737c8a" variant="Bulk" />
                  }
                >
                  {t("drawer.file", {
                    name: current.originalFilename,
                    size: formatFileSize(current.byteSize),
                    version: current.version,
                  })}
                </DetailRow>
              )}

              {/* The scan verdict, which used to be visible only on the file
                  panel that has since moved to the edit page. It is not a
                  detail a seller should have to open an editor to read —
                  "Malware found" in particular. */}
              {current && (
                <DetailRow
                  icon={<ShieldTick size="20" color="#737c8a" variant="Bulk" />}
                >
                  {t(`file.scan.${current.scanStatus}`)}
                </DetailRow>
              )}

              {versions > 1 && (
                <DetailRow
                  icon={<Layer size="20" color="#737c8a" variant="Bulk" />}
                >
                  {t("file.versions", { count: versions })}
                </DetailRow>
              )}

              {sale.activityTags?.length > 0 && (
                <DetailRow icon={<Tag size="20" color="#737c8a" variant="Bulk" />}>
                  {sale.activityTags.map((tag) => `#${tag}`).join(" ")}
                </DetailRow>
              )}

              <p className="text-[1.3rem] leading-8 text-neutral-500">
                {t("created", {
                  date: FormatDate(sale.createdAt, locale, "local"),
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter>
        <LinkPrimary
          href={`/events/sale/${slugify(sale.title, sale.saleId)}/edit`}
          className="w-full gap-4 items-center"
        >
          <Edit2 size="20" variant="Bulk" color={"#fff"} />
          {t("edit")}
        </LinkPrimary>
      </DrawerFooter>
    </DrawerContent>
  );
}

/** The icon-and-text row the event drawer uses for each fact. */
function DetailRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={"flex items-center gap-[5px]"}>
      <div
        className={
          "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full shrink-0"
        }
      >
        {icon}
      </div>
      <span
        className={"font-normal text-[1.4rem] leading-8 text-deep-200 flex-1"}
      >
        {children}
      </span>
    </div>
  );
}
