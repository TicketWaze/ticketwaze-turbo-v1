"use client";
import { Calendar2, Ticket } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { Raffle } from "@ticketwaze/typescript-config";
import formatRaffleDate from "@/lib/formatRaffleDate";
import { formatMoney } from "@ticketwaze/currency";
import { slugify } from "@/lib/Slugify";
import ActivityCard, { CardBadge, CardMeta, CardPrice } from "./ActivityCard";

const ICON = { size: "15", color: "#2e3237", variant: "Bulk" } as const;

function raffleBadge(
  raffle: Raffle,
  t: (key: string) => string,
): CardBadge | null {
  if (raffle.adminStatus === "requested")
    return { label: t("badge.requested"), tone: "neutral" };
  if (raffle.adminStatus === "review")
    return { label: t("badge.review"), tone: "warning" };
  if (raffle.adminStatus === "rejected")
    return { label: t("badge.rejected"), tone: "failure" };
  // Edits to an approved draw are reviewed after the fact; still selling.
  if (raffle.adminStatus === "approved" && raffle.pendingReviewAt)
    return { label: t("edit_under_review"), tone: "warning" };
  return null;
}

function RaffleCard({ raffle }: { raffle: Raffle }) {
  const locale = useLocale();
  const t = useTranslations("Events");
  // Raffle prices are stored in HTG; usdPrice mirrors USD-denominated raffles.
  const price =
    raffle.currency === "USD" ? raffle.usdPrice : raffle.ticketPrice;

  return (
    <ActivityCard
      href={`/events/raffle/${slugify(raffle.title, raffle.raffleId)}`}
      imageUrl={raffle.coverImageUrl}
      title={raffle.title}
      badge={raffleBadge(raffle, t)}
      meta={[
        <CardMeta key="d" icon={<Calendar2 {...ICON} />}>
          {t("raffleCard.draw")}{" "}
          {formatRaffleDate(raffle.drawAt, locale, raffle.timezone)}
        </CardMeta>,
        <CardMeta key="e" icon={<Ticket {...ICON} />}>
          {raffle.totalTicketsLimit !== null
            ? `${raffle.totalTicketsLimit} ${t("raffleCard.entries")}`
            : t("raffleCard.unlimited")}
        </CardMeta>,
      ]}
      price={
        <CardPrice
          amount={formatMoney(price, raffle.currency, locale)}
          unit={`/ ${t("raffleCard.entry")}`}
        />
      }
    />
  );
}

export default RaffleCard;
