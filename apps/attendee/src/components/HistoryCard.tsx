import React from "react";
import Image, { StaticImageData } from "next/image";
import { Calendar2, Star1 } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

function HistoryCard({
  image,
  name,
  href,
  day,
  stared,
}: {
  image: StaticImageData | string;
  name: string;
  href: string;
  day: number;
  stared: number;
}) {
  const t = useTranslations("History.activity.card");
  return (
    <Link
      href={href}
      className={`flex flex-col  lg:items-stretch  gap-4 w-full bg-white shadow-lg rounded-[10px] overflow-hidden pb-4`}
    >
      <Image
        src={image}
        className={"w-full object-cover h-60  lg:flex-auto lg:h-[19.1rem]"}
        alt={name}
        height={191}
        width={255}
      />
      <div className="w-full flex items-center justify-center gap-5 overflow-hidden">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="bg-[#F4F4F4] rounded-[50px] h-2 w-[3.15rem] shrink-0"
          />
        ))}
      </div>
      <div className={"p-4 flex flex-1 lg:flex-auto flex-col gap-4 lg:gap-4"}>
        <h1
          className={
            "font-semibold text-[1.2rem] text-deep-100 leading-[1.7rem]"
          }
        >
          {name}
        </h1>
        <div className={"flex items-center justify-between"}>
          <div className={"flex items-center gap-2"}>
            <Calendar2 size="15" color="#2e3237" variant="Bulk" />
            <p className={"font-medium text-[1rem] text-deep-100 leading6"}>
              {day} {day === 1 ? t("count.day") : t("count.days")}{" "}
              <span className={"text-neutral-600"}>{t("count.ago")}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: stared }).map((_, index) => (
              <Star1
                key={`stared-${index}`}
                size="15"
                color="#E45B00"
                variant="Bulk"
              />
            ))}

            {Array.from({ length: 5 - stared }).map((_, index) => (
              <Star1
                key={`empty-${index}`}
                size="15"
                color="#ABB0B9"
                variant="Bulk"
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default HistoryCard;
