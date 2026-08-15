import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { PublicSale } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import { notFound } from "next/navigation";
import AnimatedEventPage from "../../[slug]/AnimatedEventPage";
import EventImageLightbox from "@/components/shared/EventImageLightbox";
import OrganisationSummary from "@/components/shared/OrganisationSummary";
import SaleActions from "./SaleActions";
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

  /**
   * DOES THIS VIEWER ALREADY OWN IT?
   *
   * Read on the server so the page never offers a Buy button to somebody who
   * owns the product and would only be refused at the end of the checkout.
   * `/me/purchases` lists what they HOLD, so a product received as a gift
   * counts exactly as much as one they bought.
   */
  let alreadyOwned = false;
  if (session?.user?.accessToken) {
    try {
      const purchasesReq = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/me/purchases`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        },
      );
      const purchasesRes = await purchasesReq.json();
      alreadyOwned = Boolean(
        purchasesRes?.purchases?.some(
          (purchase: { saleId: string; revokedAt?: string | null }) =>
            purchase.saleId === sale.saleId && !purchase.revokedAt,
        ),
      );
    } catch {
      // Left false: the API refuses a duplicate purchase anyway, so the worst
      // case is the old behaviour of finding out at checkout.
      alreadyOwned = false;
    }
  }

  /**
   * Asked separately, and never cached.
   *
   * The product payload above is public and shared by every visitor, so it can
   * carry the follower COUNT but not whether *you* are one of them. A signed-out
   * visitor simply sees the un-followed state, which is the truth for them.
   */
  let isFollowing = false;
  if (session?.user?.accessToken && sale.organisation) {
    try {
      const followReq = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organisations/${sale.organisation.organisationId}/is-following`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        },
      );
      const followRes = await followReq.json();
      isFollowing = followRes?.isFollowing === true;
    } catch {
      isFollowing = false;
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
            <SaleActions
              sale={sale}
              isFavorite={isFavorite}
              alreadyOwned={alreadyOwned}
            />
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

            {/* On a phone there is no sidebar to put this in, so it follows the
                description — the same place the event page keeps it. */}
            {sale.organisation && (
              <div className="lg:hidden flex flex-col gap-8">
                <Separator />
                <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
                  {t("details")}
                </span>
                <OrganisationSummary
                  organisation={sale.organisation}
                  followersCount={sale.organisation.followersCount}
                  isFollowing={isFollowing}
                />
              </div>
            )}
          </div>

          {/*
            THE SIDEBAR, BUILT LIKE THE EVENT PAGE'S.

            The three cards that used to sit here — a price card, a "what you
            get" card and a final-sale notice — are gone. The price already sits
            on the buy button in `SaleActions`, the file type and size are on
            the product line beside it, and repeating each of them in its own
            bordered box gave a one-file product a longer sidebar than a
            multi-day event.

            What is here is what the event page puts here: who is selling, and
            how to follow them.
          */}
          <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-8 p-4 pt-0">
            <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
              {t("details")}
            </span>
            {sale.organisation && (
              <OrganisationSummary
                organisation={sale.organisation}
                followersCount={sale.organisation.followersCount}
                isFollowing={isFollowing}
              />
            )}
          </div>
        </main>
      </AnimatedEventPage>
    </AttendeeLayout>
  );
}
