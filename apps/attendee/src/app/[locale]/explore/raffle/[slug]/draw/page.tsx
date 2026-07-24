import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { Timer1 } from "iconsax-reactjs";
import BackButton from "@/components/shared/BackButton";
import { extractIdFromSlug } from "@/lib/Slugify";
import formatRaffleDate from "@/lib/formatRaffleDate";
import { notFound } from "next/navigation";
import Image from "next/image";
import DrawStage, { type DrawWinnerView } from "./DrawStage";
import type { Metadata } from "next";

type DrawResponse = {
  raffle: {
    raffleId: string;
    title: string;
    coverImageUrl: string | null;
    drawAt: string;
    drawnAt: string | null;
    timezone: string | null;
    status: string;
    organisationName: string | null;
    drawSeed: string | null;
    drawAlgorithm: string | null;
    entriesHash: string | null;
  };
  winners: DrawWinnerView[];
  entryCount: number;
  reel: string[];
};

async function getDraw(raffleId: string): Promise<DrawResponse | null> {
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/explore/raffles/${raffleId}/draw`,
    // Public and identical for every visitor. A drawn raffle never changes, so
    // the short window only matters in the minutes around the draw itself.
    { next: { revalidate: 30 } },
  ).catch(() => null);
  if (!request || !request.ok) return null;
  const response = await request.json().catch(() => null);
  if (!response?.raffle) return null;
  return response as DrawResponse;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getDraw(extractIdFromSlug(slug));
  if (!data) return {};
  return {
    title: data.raffle.title,
    openGraph: {
      title: data.raffle.title,
      images: data.raffle.coverImageUrl ? [data.raffle.coverImageUrl] : [],
    },
  };
}

/**
 * The public draw stage. Anyone with the link can watch — this is the page the
 * result emails point at, and the reveal replays on every visit rather than
 * only running live at the moment of the draw.
 */
export default async function RaffleDrawPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("Raffle");
  const data = await getDraw(extractIdFromSlug(slug));
  if (!data) notFound();

  const { raffle, winners, entryCount, reel } = data;
  const isCancelled = raffle.status === "cancelled";

  return (
    <AttendeeLayout title={raffle.title}>
      <BackButton text={t("back")} />
      <div className="w-full max-w-[72rem] mx-auto flex flex-col gap-12 pb-20">
        <header className="flex flex-col items-center gap-6 text-center">
          {raffle.coverImageUrl && (
            <Image
              src={raffle.coverImageUrl}
              alt={raffle.title}
              width={140}
              height={140}
              className="w-36 h-36 rounded-[20px] object-cover"
            />
          )}
          <div className="flex flex-col gap-2">
            <span className="text-[1.3rem] uppercase tracking-widest text-primary-500">
              {t("draw.eyebrow")}
            </span>
            <h1 className="font-primary font-medium text-[2.6rem] lg:text-[3.4rem] leading-12 text-black">
              {raffle.title}
            </h1>
            {raffle.organisationName && (
              <span className="text-[1.5rem] leading-8 text-neutral-600">
                {raffle.organisationName}
              </span>
            )}
          </div>
        </header>

        {isCancelled ? (
          <div className="flex items-start gap-4 rounded-[15px] border border-neutral-200 bg-neutral-50 p-8">
            <div className="w-[0.8rem] h-[0.8rem] rounded-full bg-neutral-400 mt-[0.6rem] shrink-0" />
            <p className="text-[1.5rem] leading-8 text-neutral-600">
              {t("draw.cancelled")}
            </p>
          </div>
        ) : !raffle.drawnAt ? (
          /* Before the draw the page still works, so the link in an email sent
             ahead of time never lands on a dead end. */
          <div className="flex flex-col items-center gap-6 rounded-[20px] border border-neutral-100 p-12 text-center">
            <span className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center">
              <Timer1 size="28" color="#737c8a" variant="Bulk" />
            </span>
            <p className="text-[1.8rem] font-medium leading-8 text-deep-100">
              {t("draw.notYet")}
            </p>
            <p className="text-[1.5rem] leading-8 text-neutral-600">
              {t("drawDate")}:{" "}
              {formatRaffleDate(raffle.drawAt, locale, raffle.timezone)}
            </p>
            <p className="text-[1.4rem] leading-8 text-neutral-500">
              {t("draw.entriesSoFar", { count: entryCount })}
            </p>
          </div>
        ) : (
          <DrawStage
            winners={winners}
            reel={reel}
            entryCount={entryCount}
          />
        )}

        {/* Verification block: the stored seed and entry-list hash, published so
            the result can actually be recomputed rather than merely trusted. */}
        {raffle.drawnAt && raffle.drawSeed && (
          <details className="rounded-[15px] border border-neutral-100 p-8">
            <summary className="text-[1.5rem] leading-8 text-deep-100 cursor-pointer font-medium">
              {t("draw.verify.title")}
            </summary>
            <div className="flex flex-col gap-6 pt-8">
              <p className="text-[1.4rem] leading-8 text-neutral-600">
                {t("draw.verify.explainer")}
              </p>
              <dl className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <dt className="text-[1.3rem] text-neutral-500 leading-6">
                    {t("draw.verify.algorithm")}
                  </dt>
                  <dd className="text-[1.4rem] text-deep-100 leading-8 break-all font-medium">
                    {raffle.drawAlgorithm}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[1.3rem] text-neutral-500 leading-6">
                    {t("draw.verify.seed")}
                  </dt>
                  <dd className="text-[1.4rem] text-deep-100 leading-8 break-all font-mono">
                    {raffle.drawSeed}
                  </dd>
                </div>
                {raffle.entriesHash && (
                  <div className="flex flex-col gap-1">
                    <dt className="text-[1.3rem] text-neutral-500 leading-6">
                      {t("draw.verify.entriesHash")}
                    </dt>
                    <dd className="text-[1.4rem] text-deep-100 leading-8 break-all font-mono">
                      {raffle.entriesHash}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </details>
        )}
      </div>
    </AttendeeLayout>
  );
}
