"use client";
import ActivityMoreMenu from "@/components/activity/ActivityMoreMenu";
import {
  AddEventToFavorite,
  RemoveEventToFavorite,
} from "@/actions/eventActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import BuyTicketAuthDialog from "./BuyTicketAuthDialog";
import { usePathname } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { ArchiveMinus } from "iconsax-reactjs";
import SaveButton from "@/components/activity/SaveButton";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Event } from "@ticketwaze/typescript-config";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { LinkPrimary } from "@/components/shared/Links";
import ShareEvent from "@/components/shared/ShareEvent";
import ReserveButton from "./ReserveButton";

export default function EventActions({
  event,
  isFavorite,
  isPast = false,
  salesEnded = false,
  hasReserved = false,
  reservationCount = 0,
}: {
  event: Event;
  isFavorite: boolean;
  isPast?: boolean;
  salesEnded?: boolean;
  /** Coming-soon activities only — whether this viewer holds a place. */
  hasReserved?: boolean;
  reservationCount?: number;
}) {
  const t = useTranslations("Event");
  const locale = useLocale();
  const { data: session } = useSession();

  const pathname = usePathname();
  async function AddToFavorite() {
    const result = await AddEventToFavorite(
      session?.user?.accessToken as string,
      event.eventId,
      event.organisationId,
      pathname,
      locale,
    );
    if (result.error) toast.error(result.message);
    return !result.error;
  }
  async function RemoveToFavorite() {
    const result = await RemoveEventToFavorite(
      session?.user?.accessToken as string,
      event.eventId,
      pathname,
      locale,
    );
    if (result.error) toast.error(result.message);
    return !result.error;
  }
  return (
    <div className="flex items-center justify-between">
      <div className="flex  gap-8">
        <ShareEvent event={event} />
        {session?.user ? (
          <SaveButton
            initialSaved={isFavorite}
            save={AddToFavorite}
            unsave={RemoveToFavorite}
          />
        ) : (
          <Dialog>
            <DialogTrigger
              aria-label={t("save")}
              className="w-fit h-fit p-[7.5px] flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 active:scale-90 transition-all duration-300"
            >
              <ArchiveMinus size={20} color="#737C8A" variant="Bulk" />
            </DialogTrigger>
            <NoAuthDialog callbackUrl={pathname} intent="save" />
          </Dialog>
        )}
        <ActivityMoreMenu
          activityId={event.eventId}
          organisationId={event.organisationId}
        />
      </div>
      {/* The activity is over, or the organiser's sales cutoff has passed:
          tickets can no longer be bought, so show a note in place of the buy
          button. The event otherwise stays listed and viewable. */}
      {/* A teaser sells nothing yet, so the buy CTA would lead to a checkout
          with no ticket types. Reserving a place stands in until it goes live. */}
      {event.isComingSoon ? (
        <ReserveButton
          eventId={event.eventId}
          initialHasReserved={hasReserved}
          initialCount={reservationCount}
        />
      ) : isPast ? (
        <span className="px-12 py-6 rounded-[100px] text-center text-neutral-600 font-medium text-[1.5rem] leading-8 flex items-center justify-center bg-neutral-100">
          {t("ended")}
        </span>
      ) : salesEnded ? (
        <span className="px-12 py-6 rounded-[100px] text-center text-neutral-600 font-medium text-[1.5rem] leading-8 flex items-center justify-center bg-neutral-100">
          {t("salesEnded")}
        </span>
      ) : session?.user ? (
        <LinkPrimary
          href={`/explore/${slugify(event.eventName, event.eventId)}/checkout`}
          className="py-[7.5px] px-12 text-[1.5rem] font-semibold tracking-[-0.50px] normal font-sans"
        >
          {t("buy")}
        </LinkPrimary>
      ) : (
        <Dialog>
          <DialogTrigger>
            <span className="px-12 py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center bg-primary-500 disabled:bg-primary-500/50 hover:bg-primary-500/80 hover:border-primary-600">
              {t("buy")}
            </span>
          </DialogTrigger>
          <BuyTicketAuthDialog
            checkoutUrl={`/explore/${slugify(event.eventName, event.eventId)}/checkout`}
            isPrivate={event.isPrivate}
            isOnline={event.eventCategory === "meet"}
          />
        </Dialog>
      )}
    </div>
  );
}
