"use client";
import React from "react";
import Image from "next/image";
import { Layer } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { slugify } from "@/lib/Slugify";
import FollowButton from "../explore/[slug]/FollowButton";

/**
 * Figma organisation card: cover, name, activity count and Follow / Unfollow.
 * The button sits outside the link so following never opens the profile.
 */
function OrganizerCard({
  image,
  title,
  number,
  id,
  isVerified,
  isFollowing,
  onFollowChange,
}: {
  image: null | string;
  title: string;
  number: number;
  id: string;
  isVerified: boolean;
  isFollowing: boolean;
  onFollowChange: (isFollowing: boolean) => void;
}) {
  const t = useTranslations("Organizers");
  const href = `/organisations/${slugify(title, id)}`;
  return (
    <div className="flex items-stretch flex-col gap-4 w-full lg:max-w-140 bg-white shadow-lg rounded-[10px] overflow-hidden pb-4 transition-shadow hover:shadow-xl">
      <Link href={href} className="flex flex-col gap-4 group">
        {image ? (
          <div className="h-60 w-full overflow-hidden">
            <Image
              src={image}
              className={
                "h-60 w-full object-cover transition-transform duration-500 group-hover:scale-105"
              }
              alt={title}
              height={150}
              width={255}
            />
          </div>
        ) : (
          <div className="h-60 w-full flex items-center justify-center bg-black text-white text-9xl font-primary">
            {title.slice()[0]?.toUpperCase()}
          </div>
        )}
        <span
          className={
            "px-4 font-semibold text-[1.2rem] text-deep-100 leading-[1.7rem]"
          }
        >
          {title} {isVerified && <VerifiedOrganisationCheckMark />}
        </span>
      </Link>
      <div className={"px-4 flex items-center justify-between gap-4"}>
        <div className={"flex items-center gap-2"}>
          <Layer size="15" color="#2e3237" variant="Bulk" />
          <p className={"font-normal text-[1rem] leading-6 text-neutral-700"}>
            <span className={"text-deep-100"}>{number}</span>{" "}
            {t("activities", { count: number })}
          </p>
        </div>
        <FollowButton
          organisationId={id}
          initialIsFollowing={isFollowing}
          onChange={onFollowChange}
        />
      </div>
    </div>
  );
}

export default OrganizerCard;
