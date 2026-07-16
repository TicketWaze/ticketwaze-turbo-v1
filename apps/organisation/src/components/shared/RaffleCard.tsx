"use client";
import { Calendar2, Ticket } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Raffle } from "@ticketwaze/typescript-config";
import formatRaffleDate from "@/lib/formatRaffleDate";
import { formatMoney } from "@ticketwaze/currency";
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";

function RaffleCard({ raffle }: { raffle: Raffle }) {
  const locale = useLocale();
  const t = useTranslations("Events");
  // Raffle prices are stored in HTG; usdPrice mirrors USD-denominated raffles.
  const price =
    raffle.currency === "USD" ? raffle.usdPrice : raffle.ticketPrice;

  return (
    <Link
      href={`/events/raffle/${slugify(raffle.title, raffle.raffleId)}`}
      className="flex flex-row items-center lg:items-stretch lg:mb-8 lg:ml-4 lg:flex-col gap-4 w-full lg:max-w-140 bg-white shadow-lg rounded-2xl overflow-hidden pb-4 pl-4 lg:pl-0">
      <div className="relative">
        {raffle.coverImageUrl && (
          <Image
            src={raffle.coverImageUrl}
            className="h-62 lg:h-[19.1rem] flex-1 lg:flex-auto w-62 lg:w-full object-cover object-top-left rounded-2xl"
            alt={raffle.title}
            height={191}
            width={255}
          />
        )}
        {raffle.adminStatus === "requested" && (
          <div className="bg-neutral-900 block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {raffle.adminStatus.toUpperCase()}
          </div>
        )}
        {raffle.adminStatus === "review" && (
          <div className="bg-warning block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {raffle.adminStatus.toUpperCase()}
          </div>
        )}
        {raffle.adminStatus === "approved" && (
          <div className="bg-success block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {raffle.adminStatus.toUpperCase()}
          </div>
        )}
        {raffle.adminStatus === "rejected" && (
          <div className="bg-failure block absolute top-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-white font-primary font-bold leading-6 w-fit">
            {raffle.adminStatus.toUpperCase()}
          </div>
        )}
        <div className="bg-primary-50 block absolute bottom-4 right-4 py-1 px-4 rounded-[30px] text-[1rem] text-primary-500 font-primary font-bold leading-6 w-fit">
          {t("raffleCard.tag").toUpperCase()}
        </div>
      </div>

      <div className="px-4 flex flex-1 lg:flex-auto min-w-0 flex-col gap-6 lg:gap-4">
        {raffle.activityTags?.length > 0 && (
          <ul className="hidden lg:flex gap-2 text-primary-500 font-medium">
            {raffle.activityTags.map((tag, key) => (
              <li key={key}>#{tag}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-col w-full gap-1">
          <h1 className="font-bold w-full truncate font-primary text-[1.2rem] text-deep-100 leading-6">
            {raffle.title}
          </h1>
          {raffle.activityTags?.length > 0 && (
            <ul className="flex gap-2 lg:hidden text-primary-500 font-medium">
              {raffle.activityTags.slice(0, 2).map((tag, key) => (
                <li key={key}>#{tag}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar2 size="15" color="#2e3237" variant="Bulk" />
            <span className="font-medium text-[1rem] text-deep-100 leading-6">
              {t("raffleCard.draw")}{" "}
              {formatRaffleDate(raffle.drawAt, locale, raffle.timezone)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket size="15" color="#2e3237" variant="Bulk" />
            <p className="font-medium text-[1rem] text-deep-100 leading-6">
              {raffle.totalTicketsLimit !== null
                ? `${raffle.totalTicketsLimit} ${t("raffleCard.entries")}`
                : t("raffleCard.unlimited")}
            </p>
          </div>
        </div>
        <p className="font-bold text-[1.2rem] leading-6 text-primary-500">
          {formatMoney(price, raffle.currency, locale)}{" "}
          <span className="font-normal text-neutral-700">
            / {t("raffleCard.entry")}
          </span>
        </p>
      </div>
    </Link>
  );
}

export default RaffleCard;
