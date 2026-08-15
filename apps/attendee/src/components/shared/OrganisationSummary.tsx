import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import FollowButton from "@/app/[locale]/explore/[slug]/FollowButton";

/**
 * WHO IS SELLING THIS — avatar, name, follower count, follow button.
 *
 * Extracted from the event page, where it existed twice (once for the mobile
 * details block, once for the desktop sidebar) and was about to exist a third
 * time on the digital-product page. Three copies of one card is three places
 * for the follow button to end up in a different state.
 *
 * The follower count is optional because the two pages learn it differently:
 * an event ships the whole `followers` array, while the product endpoint is
 * publicly cached and carries a count instead. Where it is absent the line is
 * simply not drawn, rather than rendering "0 followers" as though nobody
 * follows them.
 */
export default async function OrganisationSummary({
  organisation,
  followersCount,
  isFollowing,
}: {
  organisation: {
    organisationId: string;
    organisationName: string;
    profileImageUrl: string | null;
    isVerified: boolean;
  };
  followersCount?: number;
  isFollowing: boolean;
}) {
  const t = await getTranslations("Event");

  return (
    <div className={"flex items-center justify-between w-full gap-4"}>
      <Link
        href={`/organisations/${slugify(organisation.organisationName, organisation.organisationId)}`}
        className={"flex items-center gap-4 min-w-0"}
      >
        {organisation.profileImageUrl ? (
          <Image
            src={organisation.profileImageUrl}
            width={35}
            height={35}
            alt={organisation.organisationName}
            className="rounded-full shrink-0"
          />
        ) : (
          <span className="w-14 h-14 shrink-0 flex items-center justify-center bg-black rounded-full text-white uppercase font-medium text-[2.2rem] leading-12 font-primary">
            {organisation.organisationName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className={"flex flex-col min-w-0"}>
          <span
            className={
              "font-normal text-[1.4rem] leading-8 text-deep-200 truncate"
            }
          >
            {organisation.organisationName}{" "}
            {organisation.isVerified && <VerifiedOrganisationCheckMark />}
          </span>
          {followersCount !== undefined && (
            <span
              className={"font-normal text-[1.3rem] leading-8 text-neutral-600"}
            >
              {followersCount} {t("followers")}
            </span>
          )}
        </div>
      </Link>
      <FollowButton
        organisationId={organisation.organisationId}
        initialIsFollowing={isFollowing}
      />
    </div>
  );
}
