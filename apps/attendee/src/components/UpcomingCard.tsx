import React from "react";
import Image, { StaticImageData } from "next/image";
import { Calendar2, Ticket } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";

function UpcomingCard({
  image,
  name,
  href,
  day,
  tickets,
}: {
  image: StaticImageData | string;
  name: string;
  href: string;
  day: number;
  tickets: number;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-row items-center lg:items-stretch lg:flex-col gap-4 w-full bg-white shadow-lg rounded-[1rem] overflow-hidden pb-4`}
    >
      <Image
        src={image}
        className={"h-[191px] flex-1 lg:flex-auto lg:w-full object-cover"}
        alt={name}
        height={191}
        width={255}
      />
      <div
        className={
          "px-4 flex flex-1 lg:flex-auto flex-col gap-[1.5rem] lg:gap-4"
        }
      >
        <h1
          className={"font-semibold text-[1.2rem] text-deep-100 leading-[17px]"}
        >
          {name}
        </h1>
        <div
          className={
            "flex flex-col lg:flex-row gap-[1.5rem]  lg:items-center justify-between"
          }
        >
          <div className={"flex items-center gap-[5px]"}>
            <Calendar2 size="15" color="#2e3237" variant="Bulk" />
            <p
              className={"font-medium text-[1rem] text-deep-100 leading-[15px]"}
            >
              {day} days <span className={"text-neutral-600"}>to go</span>
            </p>
          </div>
          <div className={"flex items-center gap-[5px]"}>
            <Ticket size="15" color="#2e3237" variant="Bulk" />
            <p
              className={"font-medium text-[1rem] text-deep-100 leading-[15px]"}
            >
              {tickets} <span className={"text-neutral-700"}>tickets</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default UpcomingCard;
