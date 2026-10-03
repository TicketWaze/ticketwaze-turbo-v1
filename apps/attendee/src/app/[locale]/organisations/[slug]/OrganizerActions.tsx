/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Layer, Star, User as UserIcon } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import FollowButton from "../../explore/[slug]/FollowButton";
import ShareEvent from "@/components/shared/ShareEvent";
import { useSession } from "next-auth/react";
import { Event } from "@ticketwaze/typescript-config";

export default function OrganizerActions({
  organisation,
  events,
  shareUrl,
}: {
  organisation: any;
  events: Event[];
  /** Canonical public URL, built once by the page so both share buttons agree. */
  shareUrl: string;
}) {
  const t = useTranslations("Organizers");
  const { data: session } = useSession();
  /**
   * Read the viewer from the session rather than a prop. The page is public, so
   * there may be no viewer at all — the caller used to pass `session?.user as
   * User`, a cast that claimed a user existed even for guests.
   */
  const currentUserId = session?.user?.userId;
  const followers = organisation.followers ?? [];
  // One decimal, as in Figma ("4.3", not "4.333…"); 0 when nobody rated yet.
  const rating = Number(organisation.averageRating ?? 0).toFixed(1);
  const isFollowing = currentUserId
    ? followers.some((follower: any) => follower.userId === currentUserId)
    : false;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex  gap-8">
          <div className="flex items-center gap-4 text-[1.4rem] leading-8 text-deep-100">
            <div className="h-14 w-14 bg-neutral-100 flex items-center justify-center rounded-full">
              <Star variant="Bulk" size={20} color="#E45B00" />
            </div>
            {rating} {t("profile.rating")}
          </div>
          <div className="hidden lg:flex items-center gap-4 text-[1.4rem] leading-8 text-deep-100">
            <div className="h-14 w-14 bg-neutral-100 flex items-center justify-center rounded-full">
              <UserIcon variant="Bulk" size={20} color="#2E3237" />
            </div>
            {followers.length}{" "}
            {t("profile.followers", { count: followers.length })}
          </div>
          <div className="hidden lg:flex items-center gap-4 text-[1.4rem] leading-8 text-deep-100">
            <div className="h-14 w-14 bg-neutral-100 flex items-center justify-center rounded-full">
              <Layer variant="Bulk" size={20} color="#2E3237" />
            </div>
            {events.length} {t("activities", { count: events.length })}
          </div>
        </div>
        {/**
         * Mobile only, and a direct child of the row rather than grouped with
         * Follow: `justify-between` spreads free space equally between adjacent
         * children, so three siblings give an even rating / share / Follow
         * rhythm. Wrapped together with Follow they counted as one child and
         * the whole pair was pushed to the far edge.
         *
         * Desktop is unaffected — `lg:hidden` removes this from layout entirely,
         * leaving the original two children. Sharing happens from the title row
         * there.
         */}
        <div className="lg:hidden">
          {/* `p-6` + the 20px icon + the 2px border makes this exactly as tall
              as the Follow button's `py-6`. */}
          <ShareEvent url={shareUrl} triggerClassName="p-3 rounded-full" />
        </div>
        <FollowButton
          organisationId={organisation.organisationId}
          initialIsFollowing={isFollowing}
        />
      </div>
      <div className="flex lg:hidden gap-8 items-center">
        <div className="flex items-center gap-4 text-[1.4rem] leading-8 text-deep-100">
          <div className="h-14 w-14 bg-neutral-100 flex items-center justify-center rounded-full">
            <UserIcon variant="Bulk" size={20} color="#2E3237" />
          </div>
          {followers.length}{" "}
          {t("profile.followers", { count: followers.length })}
        </div>
        <div className="flex items-center gap-4 text-[1.4rem] leading-8 text-deep-100">
          <div className="h-14 w-14 bg-neutral-100 flex items-center justify-center rounded-full">
            <Layer variant="Bulk" size={20} color="#2E3237" />
          </div>
          {events.length} {t("activities", { count: events.length })}
        </div>
      </div>
    </div>
  );
}
