"use client";
import { slugify } from "@/lib/Slugify";
import { Raffle } from "@ticketwaze/typescript-config";
import {
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Award, Calendar2, Clock, Edit2, Timer1, Warning2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { LinkPrimary } from "@/components/shared/Links";
import formatRaffleDate from "@/lib/formatRaffleDate";

export default function RaffleDrawerContent({ raffle }: { raffle: Raffle }) {
  const t = useTranslations("Raffles.single_raffle");
  const locale = useLocale();
  const canEdit = raffle.status === "on_sale" && !raffle.deletionStatus;

  return (
    <DrawerContent className={"my-6 p-6 lg:p-12 rounded-[30px]  lg:w-[580px]"}>
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black"
            }
          >
            {t("info.title")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          Raffle details
        </DrawerDescription>
        <div className={"w-full"}>
          <div className={"w-full gap-[30px] flex flex-col"}>
            {raffle.coverImageUrl && (
              <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
                <Image
                  alt={raffle.title}
                  src={raffle.coverImageUrl}
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
                {t("info.description")}
              </span>
              <div
                className="rich-text text-[1.5rem] leading-8 text-neutral-700"
                dangerouslySetInnerHTML={{ __html: raffle.description }}
              />
            </div>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <span
                className={
                  "font-primary text-deep-100 font-medium text-[1.8rem]"
                }
              >
                {t("info.title")}
              </span>
              <div className={"flex items-center gap-[5px]"}>
                <div
                  className={
                    "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                  }
                >
                  <Calendar2 size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span
                  className={
                    "font-normal text-[1.4rem] leading-8 text-deep-200"
                  }
                >
                  {t("info.salesStart")}:{" "}
                  {formatRaffleDate(raffle.salesStartAt, locale, raffle.timezone)}
                </span>
              </div>
              <div className={"flex items-center gap-[5px]"}>
                <div
                  className={
                    "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                  }
                >
                  <Clock size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span
                  className={
                    "font-normal text-[1.4rem] leading-8 text-deep-200"
                  }
                >
                  {t("info.salesEnd")}:{" "}
                  {formatRaffleDate(raffle.salesEndAt, locale, raffle.timezone)}
                </span>
              </div>
              <div className={"flex items-center gap-[5px]"}>
                <div
                  className={
                    "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                  }
                >
                  <Timer1 size="20" color="#737c8a" variant="Bulk" />
                </div>
                <span
                  className={
                    "font-normal text-[1.4rem] leading-8 text-deep-200"
                  }
                >
                  {t("info.drawDate")}:{" "}
                  {formatRaffleDate(raffle.drawAt, locale, raffle.timezone)}{" "}
                  (
                  {raffle.drawMode === "automatic"
                    ? t("info.automatic")
                    : t("info.manual")}
                  )
                </span>
              </div>
            </div>
            <div className={"w-full flex flex-col gap-[1.5rem] justify-start"}>
              <span
                className={
                  "font-primary text-deep-100 font-medium text-[1.8rem]"
                }
              >
                {t("prizes.title")}
              </span>
              {[...raffle.prizes]
                .sort((a, b) => a.rank - b.rank)
                .map((prize) => (
                  <div
                    key={prize.rafflePrizeId}
                    className={"flex items-center gap-[5px]"}
                  >
                    <div
                      className={
                        "w-[35px] h-[35px] flex items-center justify-center bg-neutral-100 rounded-full"
                      }
                    >
                      <Award size="20" color="#737c8a" variant="Bulk" />
                    </div>
                    <span
                      className={
                        "font-normal text-[1.4rem] leading-8 text-deep-200"
                      }
                    >
                      {prize.rank}. {prize.title}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      <DrawerFooter className="lg:flex-row pb-0">
        {raffle.deletionStatus ? (
          <div className="flex-1 flex items-center gap-3 rounded-[100px] border border-amber-300 bg-amber-50 px-5 py-[14px] text-amber-700 text-[1.4rem] font-medium leading-8 cursor-not-allowed">
            <Warning2 variant="Bulk" color="#b45309" size={20} />
            <span>{t("deletion.pending_notice")}</span>
          </div>
        ) : (
          canEdit && (
            <LinkPrimary
              href={`/events/raffle/${slugify(raffle.title, raffle.raffleId)}/edit`}
              className="flex-1 gap-4"
            >
              <Edit2 variant={"Bulk"} color={"#ffffff"} size={20} /> {t("edit")}
            </LinkPrimary>
          )
        )}
      </DrawerFooter>
    </DrawerContent>
  );
}
