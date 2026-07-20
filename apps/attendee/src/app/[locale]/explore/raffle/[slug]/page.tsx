/* eslint-disable @typescript-eslint/no-explicit-any */
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Award, Calendar2, Timer1, Ticket, RouteSquare } from "iconsax-reactjs";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import FollowButton from "../../[slug]/FollowButton";
import Map from "../../[slug]/MapComponent";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Raffle } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import { extractIdFromSlug } from "@/lib/Slugify";
import formatRaffleDate from "@/lib/formatRaffleDate";
import { formatMoney } from "@ticketwaze/currency";
import { notFound } from "next/navigation";
import AnimatedEventPage from "../../[slug]/AnimatedEventPage";
import EventImageLightbox from "@/components/shared/EventImageLightbox";
import RaffleActions from "./RaffleActions";

function Separator() {
  return <div className="bg-neutral-100 h-[0.2rem] w-full shrink-0"></div>;
}

export default async function RafflePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raffleId = extractIdFromSlug(slug);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("Raffle");

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/explore/raffles/${raffleId}`,
    // Cached: public and identical for every visitor. `remaining` can be up to
    // a minute stale, which is harmless — the entry purchase re-checks the
    // offering server-side and refuses to oversell.
    { next: { revalidate: 60 } },
  ).catch(() => null);
  if (!request || !request.ok) notFound();
  const response = await request.json().catch(() => null);
  if (!response?.raffle) notFound();

  const raffle: Raffle = response.raffle;
  const organisation = response.organisation;
  const remaining: number | null = response.remaining ?? null;
  const price = raffle.currency === "USD" ? raffle.usdPrice : raffle.ticketPrice;
  const soldOut = remaining !== null && remaining <= 0;
  const isFollowing = (organisation?.followers ?? []).filter(
    (follower: any) => follower.userId === session?.user.userId,
  );

  // Favorite state (reuses the activity-scoped favorite endpoint).
  let isFavorite = false;
  if (session?.user?.accessToken) {
    try {
      const favReq = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/${raffleId}/favorite`,
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
    <AttendeeLayout title={raffle.title}>
      <AnimatedEventPage>
        <BackButton text={t("back")} />
        <span className="font-primary font-medium text-[2.6rem] leading-12 text-black mb-4">
          {raffle.title}
        </span>
        <main className="w-full gap-8 flex flex-col lg:grid lg:grid-cols-[29fr_23fr] lg:min-h-0 lg:overflow-y-auto lg:h-full">
          <div className="flex flex-col gap-8 overflow-y-auto min-h-0">
            {raffle.coverImageUrl && (
              <EventImageLightbox
                src={raffle.coverImageUrl}
                alt={raffle.title}
                width={580}
                height={298}
              />
            )}
            <RaffleActions
              raffle={raffle}
              soldOut={soldOut}
              isFavorite={isFavorite}
            />
            <Separator />
            <div className="flex flex-col gap-4">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                {t("about")}
              </span>
              <div
                className="rich-text text-[1.6rem] font-sans leading-10 text-neutral-700"
                dangerouslySetInnerHTML={{ __html: raffle.description }}
              />
            </div>
            <Separator />
            <div className="flex flex-col gap-6">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-100 inline-flex items-center gap-2">
                <Award size="20" color="#0d0d0d" variant="Bulk" />
                {t("prizes")}
              </span>
              <ul className="flex flex-col gap-4">
                {[...raffle.prizes]
                  .sort((a, b) => a.rank - b.rank)
                  .map((prize) => (
                    <li
                      key={prize.rafflePrizeId}
                      className="flex items-start gap-4 rounded-[15px] border border-neutral-100 p-6"
                    >
                      <span className="shrink-0 w-14 h-14 rounded-full bg-primary-50 text-primary-500 font-bold flex items-center justify-center text-[1.5rem]">
                        {prize.rank}
                      </span>
                      <div className="flex flex-col gap-1">
                        <p className="text-[1.6rem] font-medium leading-8 text-deep-100">
                          {prize.title}
                        </p>
                        <p className="text-[1.4rem] leading-8 text-neutral-600">
                          {prize.description || t("noDescription")}
                        </p>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>

            {/* mobile details */}
            <div className="lg:hidden flex flex-col gap-8">
              <RaffleDetails
                organisation={organisation}
                isFollowing={isFollowing.length > 0}
                raffle={raffle}
                remaining={remaining}
                price={price}
                locale={locale}
                t={t}
              />
            </div>
            <div></div>
          </div>

          {/* desktop details */}
          <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-8 p-4 pt-0">
            <RaffleDetails
              organisation={organisation}
              isFollowing={isFollowing.length > 0}
              raffle={raffle}
              remaining={remaining}
              price={price}
              locale={locale}
              t={t}
            />
          </div>
        </main>
      </AnimatedEventPage>
    </AttendeeLayout>
  );
}

function RaffleDetails({
  organisation,
  isFollowing,
  raffle,
  remaining,
  price,
  locale,
  t,
}: {
  organisation: any;
  isFollowing: boolean;
  raffle: Raffle;
  remaining: number | null;
  price: number;
  locale: string;
  t: (key: string) => string;
}) {
  return (
    <div className={"flex flex-col gap-8"}>
      <span className={"font-semibold text-[1.6rem] leading-8 text-deep-200"}>
        {t("about")}
      </span>
      {/* organizer */}
      {organisation && (
        <div className={"flex items-center justify-between w-full"}>
          <Link
            href={`/organisations/${organisation.organisationId}`}
            className={"flex items-center gap-4"}
          >
            {organisation?.profileImageUrl ? (
              <Image
                src={organisation.profileImageUrl}
                width={35}
                height={35}
                alt={organisation.organisationName}
                className="rounded-full"
              />
            ) : (
              <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
                {organisation?.organisationName.slice()[0]?.toUpperCase()}
              </span>
            )}
            <div className={"flex flex-col"}>
              <span
                className={"font-normal text-[1.4rem] leading-8 text-deep-200"}
              >
                {organisation.organisationName}{" "}
                {organisation.isVerified && <VerifiedOrganisationCheckMark />}
              </span>
              <span
                className={
                  "font-normal text-[1.3rem] leading-8 text-neutral-600"
                }
              >
                {(organisation.followers ?? []).length} {t("followers")}
              </span>
            </div>
          </Link>
          <FollowButton
            organisationId={raffle.organisationId}
            initialIsFollowing={isFollowing}
          />
        </div>
      )}
      {/* draw + entry info */}
      <ul className="flex flex-col gap-6">
        <li className={"flex items-center gap-2"}>
          <div
            className={
              "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
            }
          >
            <Ticket size="20" color="#737c8a" variant="Bulk" />
          </div>
          <span
            className={"font-normal text-[1.4rem] leading-8 text-deep-200"}
          >
            {formatMoney(price, raffle.currency, locale)} {t("perEntry")}
          </span>
        </li>
        <li className={"flex items-center gap-2"}>
          <div
            className={
              "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
            }
          >
            <Timer1 size="20" color="#737c8a" variant="Bulk" />
          </div>
          <span
            className={"font-normal text-[1.4rem] leading-8 text-deep-200"}
          >
            {t("drawDate")}:{" "}
            {formatRaffleDate(raffle.drawAt, locale, raffle.timezone)}
          </span>
        </li>
        <li className={"flex items-center gap-2"}>
          <div
            className={
              "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
            }
          >
            <Calendar2 size="20" color="#737c8a" variant="Bulk" />
          </div>
          <span
            className={"font-normal text-[1.4rem] leading-8 text-deep-200"}
          >
            {t("entriesLeft")}:{" "}
            {remaining === null ? t("unlimited") : remaining}
          </span>
        </li>
      </ul>
      {/* map — only when the organiser set a location */}
      {raffle.location && (
        <>
          <div className="bg-neutral-100 h-[0.2rem] w-full shrink-0" />
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[1.6rem] leading-8 text-deep-200">
                {t("direction")}
              </span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${raffle.location.lat},${raffle.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-[1.6rem] leading-8 text-primary-500"
              >
                {t("openMaps")}{" "}
                <RouteSquare variant="Bulk" color="#E45B00" size={20} />
              </a>
            </div>
            <Map location={raffle.location} />
          </div>
        </>
      )}
    </div>
  );
}
