/* eslint-disable @typescript-eslint/no-explicit-any */
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Award, Timer1, Ticket } from "iconsax-reactjs";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { auth } from "@/lib/auth";
import { Link, redirect } from "@/i18n/navigation";
import { MyRaffle } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import { extractIdFromSlug, slugify } from "@/lib/Slugify";
import formatRaffleDate from "@/lib/formatRaffleDate";
import { formatMoney } from "@ticketwaze/currency";
import { notFound } from "next/navigation";
import AnimatedEventPage from "../../../explore/[slug]/AnimatedEventPage";
import EventImageLightbox from "@/components/shared/EventImageLightbox";

function Separator() {
  return <div className="bg-neutral-100 h-[0.2rem] w-full shrink-0"></div>;
}

/**
 * The buyer's own view of a raffle they entered. Deliberately mirrors the
 * public raffle page's layout, with the purchase column replaced by the entry
 * numbers they hold — this is the only place those numbers live in the product.
 */
export default async function MyRafflePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raffleId = extractIdFromSlug(slug);
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("Raffle");

  if (!session) {
    redirect({ href: "/auth/login", locale });
  }

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/me/raffles/${raffleId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  ).catch(() => null);
  // The endpoint 404s when the caller holds no entry, so a miss here means
  // "not yours" just as much as "does not exist" — both are a not-found.
  if (!request || !request.ok) notFound();
  const response = await request.json().catch(() => null);
  if (!response?.raffle) notFound();

  const raffle: MyRaffle = response.raffle;
  const organisation = raffle.organisation;
  const entries = raffle.entries ?? [];
  const price =
    raffle.currency === "USD" ? raffle.usdPrice : raffle.ticketPrice;

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

            {/* entries on mobile */}
            <div className="lg:hidden flex flex-col gap-8">
              <MyEntries
                raffle={raffle}
                entries={entries}
                organisation={organisation}
                price={price}
                locale={locale}
                t={t}
              />
            </div>
            <div></div>
          </div>

          {/* entries on desktop (second column) */}
          <div className="hidden lg:flex lg:flex-col lg:overflow-y-auto min-h-0 flex-col gap-8 p-4 pt-0">
            <MyEntries
              raffle={raffle}
              entries={entries}
              organisation={organisation}
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

type Outcome = "pending" | "won" | "lost" | "cancelled";

/** What this buyer's entries came to, from their own entries vs the prizes. */
function resolveOutcome(raffle: MyRaffle, entries: MyRaffle["entries"]): Outcome {
  if (raffle.status === "cancelled") return "cancelled";
  if (!raffle.drawnAt) return "pending";
  const mine = new Set(entries.map((entry) => entry.ticketId));
  const won = (raffle.prizes ?? []).some(
    (prize) =>
      prize.winningRaffleTicketId && mine.has(prize.winningRaffleTicketId),
  );
  return won ? "won" : "lost";
}

function MyEntries({
  raffle,
  entries,
  organisation,
  price,
  locale,
  t,
}: {
  raffle: MyRaffle;
  entries: MyRaffle["entries"];
  organisation: any;
  price: number;
  locale: string;
  t: (key: string, values?: Record<string, any>) => string;
}) {
  const outcome = resolveOutcome(raffle, entries);
  return (
    <div className={"flex flex-col gap-8"}>
      <div className="flex flex-col gap-2">
        <span className={"font-semibold text-[1.6rem] leading-8 text-deep-200"}>
          {t("myEntries.title")}
        </span>
        <span className={"text-[1.4rem] leading-8 text-neutral-600"}>
          {t("myEntries.count", { count: entries.length })}
        </span>
      </div>

      <ul className="flex flex-col gap-4">
        {entries.map((entry) => (
          <li
            key={entry.ticketId}
            className="flex items-center gap-4 rounded-[15px] border border-neutral-100 p-6"
          >
            <span
              className={
                "w-14 h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full"
              }
            >
              <Ticket size="20" color="#737c8a" variant="Bulk" />
            </span>
            <span className="font-primary font-bold text-[1.8rem] leading-8 text-deep-100 tracking-wider">
              {entry.ticketName}
            </span>
          </li>
        ))}
      </ul>

      {/* Outcome, resolved from the buyer's own entries against the awarded
          prizes — the API never tells them directly whether they won. */}
      <p
        className={`text-[1.4rem] leading-8 ${outcome === "won" ? "text-primary-500 font-medium" : "text-neutral-600"}`}
      >
        {outcome === "won"
          ? t("myEntriesDrawn.won")
          : outcome === "cancelled"
            ? t("myEntriesDrawn.cancelled")
            : outcome === "lost"
              ? t("myEntriesDrawn.lost")
              : t("myEntries.awaitingDraw")}
      </p>

      {raffle.drawnAt && (
        <Link
          href={`/explore/raffle/${slugify(raffle.title, raffle.raffleId)}/draw`}
          className="inline-flex items-center gap-4 text-[1.6rem] leading-8 text-primary-500"
        >
          {t("results.watch")}
        </Link>
      )}

      <Separator />

      <ul className="flex flex-col gap-6">
        <li className={"flex items-center gap-2"}>
          <div
            className={
              "w-14 h-14 flex items-center justify-center bg-neutral-100 rounded-full"
            }
          >
            <Timer1 size="20" color="#737c8a" variant="Bulk" />
          </div>
          <span className={"font-normal text-[1.4rem] leading-8 text-deep-200"}>
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
            <Ticket size="20" color="#737c8a" variant="Bulk" />
          </div>
          <span className={"font-normal text-[1.4rem] leading-8 text-deep-200"}>
            {formatMoney(price, raffle.currency, locale)} {t("perEntry")}
          </span>
        </li>
      </ul>

      {organisation && (
        <>
          <Separator />
          <Link
            href={`/organisations/${slugify(organisation.organisationName, organisation.organisationId)}`}
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
                className={"font-normal text-[1.3rem] leading-8 text-neutral-600"}
              >
                {t("myEntries.organiser")}
              </span>
              <span
                className={"font-normal text-[1.4rem] leading-8 text-deep-200"}
              >
                {organisation.organisationName}{" "}
                {organisation.isVerified && <VerifiedOrganisationCheckMark />}
              </span>
            </div>
          </Link>
        </>
      )}
    </div>
  );
}
