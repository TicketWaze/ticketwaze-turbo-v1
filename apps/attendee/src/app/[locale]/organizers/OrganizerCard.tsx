import React from "react";
import Image from "next/image";
import { Layer, Location } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";

function OrganizerCard({
  image,
  title,
  number,
  id,
  city,
  country,
  isVerified,
}: {
  image: null | string;
  title: string;
  number: number;
  id: string;
  city: string;
  country: string;
  isVerified: boolean;
}) {
  const t = useTranslations("Organizers");
  return (
    <Link
      href={`organizers/${id}`}
      className={
        "flex items-stretch flex-col gap-4 w-full lg:max-w-[350px] bg-white shadow-lg rounded-[1rem] overflow-hidden pb-4"
      }
    >
      {image ? (
        <Image
          src={image}
          className={"h-[150px] w-full object-cover"}
          alt={title}
          height={150}
          width={255}
        />
      ) : (
        <div className="h-[150px] w-full flex items-center justify-center bg-black text-white text-9xl font-primary">
          {title.slice()[0]?.toUpperCase()}
        </div>
      )}
      <div className={"px-4 flex flex-col gap-[1.5rem] lg:gap-4"}>
        <span
          className={"font-semibold text-[1.2rem] text-deep-100 leading-[17px]"}
        >
          {title} {isVerified && <VerifiedOrganisationCheckMark />}
        </span>
        <div className={"flex items-center justify-between"}>
          <div className={"flex items-center gap-[5px]"}>
            <Layer size="15" color="#2e3237" variant="Bulk" />
            <p
              className={
                "font-normal text-[1rem] leading-[15px] text-neutral-700"
              }
            >
              <span className={"text-deep-100"}>{number}</span> {t("event")}
            </p>
          </div>
          <div className={"flex items-center gap-[5px]"}>
            <Location size="15" color="#2e3237" variant="Bulk" />
            <p
              className={"font-medium text-[1rem] text-deep-100 leading-[15px]"}
            >
              {city}, <span className={"text-neutral-700"}>{country}</span>
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default OrganizerCard;
