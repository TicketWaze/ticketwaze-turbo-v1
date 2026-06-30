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
      className={`flex flex-row items-center lg:items-stretch lg:mb-8 lg:ml-4 lg:flex-col gap-4 w-full bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 pl-4 lg:pl-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl`}
    >
      <div className="relative">
        <Image
          src={image}
          className={
            "h-62 lg:max-h-[19.1rem] flex-1 lg:flex-auto w-62 lg:w-full object-cover object-top-left rounded-[10px]"
          }
          alt={name}
          height={191}
          width={255}
        />
      </div>
      <div className={"px-4 flex flex-1 lg:flex-auto flex-col gap-6 lg:gap-4"}>
        <h1
          className={
            "font-bold font-primary text-[1.2rem] text-deep-100 leading-[1.7rem]"
          }
        >
          {name}
        </h1>
        <div
          className={
            "flex flex-col lg:flex-row gap-6  lg:items-center justify-between"
          }
        >
          <div className={"flex items-center gap-2"}>
            <Calendar2 size="15" color="#2e3237" variant="Bulk" />
            <p className={"font-medium text-[1rem] text-deep-100 leading-6"}>
              {day} days <span className={"text-neutral-600"}>to go</span>
            </p>
          </div>
          <div className={"flex items-center gap-2"}>
            <Ticket size="15" color="#2e3237" variant="Bulk" />
            <p className={"font-medium text-[1rem] text-deep-100 leading-6"}>
              {tickets} <span className={"text-neutral-700"}>tickets</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default UpcomingCard;
