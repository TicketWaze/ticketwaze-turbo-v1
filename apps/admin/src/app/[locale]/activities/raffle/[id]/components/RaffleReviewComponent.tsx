"use client";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Raffle } from "@ticketwaze/typescript-config";
import { formatMoney } from "@ticketwaze/currency";
import formatRaffleDate from "@/lib/formatRaffleDate";
import { useRouter } from "next/navigation";
import { ArrowLeft, Award } from "iconsax-reactjs";
import { RaffleStatusDialog, StatusBadge } from "./RaffleStatusDialog";

export default function RaffleReviewComponent({
  raffle,
  organisation,
  entriesSold,
}: {
  raffle: Raffle;
  organisation: {
    organisationName: string;
    profileImageUrl: string | null;
    isVerified?: boolean;
    followersCount?: number;
  } | null;
  entriesSold: number;
}) {
  const locale = useLocale();
  const router = useRouter();
  const price = raffle.currency === "USD" ? raffle.usdPrice : raffle.ticketPrice;

  return (
    <div className="flex flex-col gap-12 overflow-y-scroll">
      <button
        onClick={() => router.push("/activities")}
        className="flex items-center gap-4 w-fit cursor-pointer"
      >
        <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
          <ArrowLeft size="20" color="#0d0d0d" variant="Bulk" />
        </div>
        <span className="text-neutral-700 text-[1.4rem] leading-8">Back</span>
      </button>

      <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
            {raffle.title}
          </h3>
          <StatusBadge status={raffle.adminStatus} />
        </div>
        <RaffleStatusDialog raffle={raffle} />
      </div>

      {raffle.adminStatus === "rejected" && raffle.rejectionReason && (
        <div className="flex flex-col gap-2 rounded-[15px] border border-[#E53935]/30 bg-[#FCE5EA] p-6">
          <span className="text-[1.4rem] font-medium text-failure">
            Rejection reason
          </span>
          <p className="text-[1.4rem] leading-8 text-neutral-700">
            {raffle.rejectionReason}
          </p>
        </div>
      )}

      {raffle.coverImageUrl && (
        <div className="relative w-full h-100 lg:h-140 rounded-[15px] overflow-hidden">
          <Image
            src={raffle.coverImageUrl}
            alt={raffle.title}
            fill
            className="object-cover object-top"
          />
        </div>
      )}

      {/* organizer */}
      {organisation && (
        <div className="flex items-center gap-4">
          {organisation.profileImageUrl ? (
            <Image
              src={organisation.profileImageUrl}
              width={40}
              height={40}
              alt={organisation.organisationName}
              className="rounded-full"
            />
          ) : (
            <span className="w-14 h-14 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2rem] font-primary">
              {organisation.organisationName.slice(0, 1)}
            </span>
          )}
          <div className="flex flex-col">
            <span className="text-[1.5rem] text-deep-100 leading-8">
              {organisation.organisationName}
            </span>
            <span className="text-[1.3rem] text-neutral-600 leading-6">
              {organisation.followersCount ?? 0} followers
            </span>
          </div>
        </div>
      )}

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 border-neutral-100 border-b">
        <Stat label="Entry price" value={formatMoney(price, raffle.currency, locale)} />
        <Stat label="Entries sold" value={String(entriesSold)} />
        <Stat label="Prizes" value={String(raffle.prizes.length)} />
        <Stat
          label="Draw date"
          value={formatRaffleDate(raffle.drawAt, locale, raffle.timezone)}
        />
      </div>

      {/* details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Detail
          label="Sales start"
          value={formatRaffleDate(raffle.salesStartAt, locale, raffle.timezone)}
        />
        <Detail
          label="Sales end"
          value={formatRaffleDate(raffle.salesEndAt, locale, raffle.timezone)}
        />
        <Detail
          label="Draw mode"
          value={raffle.drawMode === "automatic" ? "Automatic" : "Manual"}
        />
        <Detail
          label="Total entries"
          value={
            raffle.totalTicketsLimit !== null
              ? String(raffle.totalTicketsLimit)
              : "Unlimited"
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        <span className="font-medium font-primary text-[1.8rem] text-black">
          Description
        </span>
        <div
          className="text-[1.5rem] leading-10 text-neutral-800 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: raffle.description }}
        />
      </div>

      {/* prizes */}
      <div className="flex flex-col gap-4">
        <span className="font-medium font-primary text-[1.8rem] text-black inline-flex items-center gap-2">
          <Award size="22" color="#0d0d0d" variant="Bulk" />
          Prizes
        </span>
        <ul className="flex flex-col gap-4">
          {[...raffle.prizes]
            .sort((a, b) => a.rank - b.rank)
            .map((prize) => (
              <li
                key={prize.rafflePrizeId}
                className="flex items-start gap-4 rounded-[15px] border border-neutral-100 p-6"
              >
                <span className="shrink-0 w-12 h-12 rounded-full bg-primary-50 text-primary-500 font-bold flex items-center justify-center text-[1.4rem]">
                  {prize.rank}
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-[1.6rem] font-medium leading-8 text-deep-100">
                    {prize.title}
                  </p>
                  <p className="text-[1.3rem] leading-6 text-neutral-600">
                    {prize.description || "No description"}
                  </p>
                </div>
              </li>
            ))}
        </ul>
      </div>
      <div></div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="pb-8 lg:pb-12 pl-0 lg:pl-10 first:pl-0">
      <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
        {label}
      </span>
      <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
        {value}
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-[15px] border border-neutral-100 p-6">
      <span className="text-[1.2rem] text-neutral-600 leading-6">{label}</span>
      <span className="text-[1.5rem] text-deep-100 leading-8">{value}</span>
    </div>
  );
}
