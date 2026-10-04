"use client";
import ActivityMoreMenu from "@/components/activity/ActivityMoreMenu";
import {
  AddEventToFavorite,
  RemoveEventToFavorite,
} from "@/actions/eventActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import { Link, usePathname } from "@/i18n/navigation";
import { ArchiveMinus } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import ReportEventComponent from "../../[slug]/ReportEventComponent";
import ReportOrganisationComponent from "../../[slug]/ReportOrganisationComponent";
import { Restaurant } from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import ShareEvent from "@/components/shared/ShareEvent";

/**
 * Mirrors EventActions. Favourites and reports are keyed on the activity id,
 * and a restaurant's id IS its activity id, so the existing event actions work
 * unchanged — no restaurant-specific endpoints needed.
 */
export default function RestaurantActions({
  restaurant,
  isFavorite,
}: {
  restaurant: Restaurant;
  isFavorite: boolean;
}) {
  const t = useTranslations("Event");
  const tr = useTranslations("Event.restaurantDetail");
  const locale = useLocale();
  const { data: session } = useSession();

  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  const shareUrl = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/restaurant/${restaurant.slug}`;

  async function AddToFavorite() {
    setIsLoading(true);
    const result = await AddEventToFavorite(
      session?.user?.accessToken as string,
      restaurant.restaurantId,
      restaurant.organisationId,
      pathname,
      locale,
    );
    if (result.error) {
      toast.error(result.message);
    }
    setIsLoading(false);
  }

  async function RemoveToFavorite() {
    setIsLoading(true);
    const result = await RemoveEventToFavorite(
      session?.user?.accessToken as string,
      restaurant.restaurantId,
      pathname,
      locale,
    );
    if (result.error) {
      toast.error(result.message);
    }
    setIsLoading(false);
  }

  return (
    <div className="flex items-center justify-between">
      <PageLoader isLoading={isLoading} />
      <div className="flex gap-8">
        <ShareEvent url={shareUrl} activityId={restaurant.restaurantId} />
        {session?.user && isFavorite && (
          <button
            disabled={isLoading}
            onClick={RemoveToFavorite}
            className="p-[7.5px] group flex items-center justify-center rounded-[30px] cursor-pointer bg-primary-100"
          >
            <ArchiveMinus width={20} height={20} color="#E45B00" variant="Bulk" />
          </button>
        )}
        {session?.user && !isFavorite && (
          <button
            disabled={isLoading}
            onClick={AddToFavorite}
            className="w-fit h-fit p-[7.5px] group flex items-center justify-center bg-neutral-100 rounded-full cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500"
          >
            <ArchiveMinus
              width={20}
              height={20}
              className=" stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500"
              variant="Bulk"
            />
          </button>
        )}
        {!session?.user && (
          <Dialog>
            <DialogTrigger>
              <span className="w-fit h-fit p-[7.5px] group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
                <ArchiveMinus
                  width={20}
                  height={20}
                  className='"stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500'
                  variant="Bulk"
                />
              </span>
            </DialogTrigger>
            <NoAuthDialog callbackUrl={pathname} intent="save" />
          </Dialog>
        )}
        <ActivityMoreMenu
          activityId={restaurant.restaurantId}
          organisationId={restaurant.organisationId}
        />
      </div>

      {/*
        Only offered when the venue actually takes bookings — otherwise the
        reserve page 404s, which is a worse answer than not showing the button.
      */}
      {restaurant.acceptsReservations ? (
        <Link
          href={`/explore/restaurant/${restaurant.slug}/reserve`}
          className="px-12 py-6 rounded-[100px] text-center font-medium text-[1.5rem] leading-8 flex items-center justify-center bg-primary-500 text-white hover:bg-primary-600 transition-colors"
        >
          {tr("reserve")}
        </Link>
      ) : null}
    </div>
  );
}
