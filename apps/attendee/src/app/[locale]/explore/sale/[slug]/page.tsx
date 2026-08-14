import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { DocumentText, Danger, DocumentDownload } from "iconsax-reactjs";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { auth } from "@/lib/auth";
import { PublicSale } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import { formatMoney } from "@ticketwaze/currency";
import { notFound } from "next/navigation";
import AnimatedEventPage from "../../[slug]/AnimatedEventPage";
import EventImageLightbox from "@/components/shared/EventImageLightbox";
import SaleActions from "./SaleActions";
import { fileKind, formatFileSize } from "@/lib/saleFile";
import { extractIdFromSlug } from "@/lib/Slugify";

function Separator() {
  return <div className="bg-neutral-100 h-[0.2rem] w-full shrink-0"></div>;
}

export default async function SalePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // The URL is {title-slug}-{saleId}; the id is the identity, the title is
  // decoration, so renaming a product never breaks a shared link.
  const saleId = extractIdFromSlug(slug);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("Sale");

  /**
   * The API serves only `live` products here, so a draft, a product still
   * scanning, one awaiting review and one that was rejected all 404 — guessing
   * the URL of an unapproved product must not reach it.
   *
   * Cached: public and identical for every visitor.
   */
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/explore/sales/${saleId}`,
    { next: { revalidate: 60 } },
  ).catch(() => null);
  if (!request || !request.ok) notFound();
  const response = await request.json().catch(() => null);
  if (!response?.sale) notFound();

  const sale: PublicSale = response.sale;

  // Favourites are activity-scoped, and a sale shares its id with its activity.
  let isFavorite = false;
  if (session?.user?.accessToken) {
    try {
      const favReq = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${sale.saleId}/favorite`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        },
      );
      const favRes = await favReq.json();
      isFavorite = favRes?.isFavorite === true;
    } catch {
      isFavorite = false;
    }
  }

  return (
    <AttendeeLayout title={sale.title}>
      <AnimatedEventPage>
        <BackButton text={t("back")} />
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {sale.title}
        </span>
        <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 lg:overflow-y-auto lg:h-full">
          <div className="flex flex-col gap-8 overflow-y-auto min-h-0">
            {sale.coverImageUrl && (
              <EventImageLightbox
                src={sale.coverImageUrl}
                alt={sale.title}
                width={580}
                height={298}
              />
            )}
            <SaleActions sale={sale} isFavorite={isFavorite} />
            <Separator />
            <div className="flex flex-col gap-4">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("about")}
              </span>
              <div
                className="rich-text text-[1.6rem] font-sans leading-10 text-neutral-700"
                dangerouslySetInnerHTML={{ __html: sale.description }}
              />
            </div>
            {sale.activityTags?.length > 0 && (
              <>
                <Separator />
                <ul className="flex flex-wrap gap-3 text-primary-500 font-medium text-[1.5rem]">
                  {sale.activityTags.map((tag, key) => (
                    <li key={key}>#{tag}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <aside className="flex flex-col gap-8 lg:overflow-y-auto min-h-0">
            {/* Price. One number, all in — the surcharge is never itemised to a
                buyer (SALE-MODULE.md §6). */}
            <div className="flex flex-col gap-2 rounded-[15px] border border-neutral-100 p-8">
              <span className="text-[1.4rem] leading-8 text-neutral-600">
                {t("price")}
              </span>
              <span className="font-primary font-medium text-[2.6rem] leading-12 text-primary-500">
                {formatMoney(
                  sale.pricing.buyerPays,
                  sale.pricing.currency,
                  locale,
                )}
              </span>
            </div>

            {/* What you get. A buyer cannot open the file before paying, so the
                type and size are the only things they can judge it by. */}
            {sale.file && (
              <div className="flex flex-col gap-6 rounded-[15px] border border-neutral-100 p-8">
                <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                  {t("whatYouGet")}
                </span>
                <div className="flex items-center gap-4">
                  <DocumentText size="20" color="#2e3237" variant="Bulk" />
                  <span className="text-[1.5rem] leading-8 text-neutral-700">
                    {fileKind(sale.file.originalFilename, sale.file.mimeType)}
                    {" · "}
                    {formatFileSize(sale.file.byteSize)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <DocumentDownload size="20" color="#2e3237" variant="Bulk" />
                  <span className="text-[1.5rem] leading-8 text-neutral-700">
                    {t("instantDownload")}
                  </span>
                </div>
              </div>
            )}

            {/* Stated before purchase, not after. This is the one term a buyer
                of a digital file has to know up front. */}
            <div className="flex items-start gap-4 rounded-[15px] bg-neutral-100 p-8">
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

            {sale.organisation && (
              <div className="flex flex-col gap-4 rounded-[15px] border border-neutral-100 p-8">
                <span className="text-[1.4rem] leading-8 text-neutral-600">
                  {t("soldBy")}
                </span>
                <div className="flex items-center gap-4">
                  {sale.organisation.profileImageUrl ? (
                    <Image
                      src={sale.organisation.profileImageUrl}
                      width={40}
                      height={40}
                      alt={sale.organisation.organisationName}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2rem] font-primary">
                      {sale.organisation.organisationName.slice(0, 1)}
                    </span>
                  )}
                  <span className="text-[1.5rem] text-deep-100 leading-8 inline-flex items-center gap-2">
                    {sale.organisation.organisationName}
                    {sale.organisation.isVerified && (
                      <VerifiedOrganisationCheckMark />
                    )}
                  </span>
                </div>
              </div>
            )}
          </aside>
        </main>
      </AnimatedEventPage>
    </AttendeeLayout>
  );
}
