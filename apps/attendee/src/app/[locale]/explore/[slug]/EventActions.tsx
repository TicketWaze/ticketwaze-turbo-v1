"use client";
import {
  AddEventToFavorite,
  RemoveEventToFavorite,
} from "@/actions/eventActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import { usePathname } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { Heart, MoreCircle } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import ReportEventComponent from "./ReportEventComponent";
import ReportOrganisationComponent from "./ReportOrganisationComponent";
import { Event } from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LinkPrimary } from "@/components/shared/Links";
import ShareEvent from "@/components/shared/ShareEvent";

export default function EventActions({
  event,
  isFavorite,
}: {
  event: Event;
  isFavorite: boolean;
}) {
  const t = useTranslations("Event");
  const locale = useLocale();
  const { data: session } = useSession();

  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  async function AddToFavorite() {
    setIsLoading(true);
    const result = await AddEventToFavorite(
      session?.user?.accessToken as string,
      event.eventId,
      event.organisationId,
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
      event.eventId,
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
      <div className="flex  gap-8">
        <ShareEvent event={event} />
        {session?.user && isFavorite && (
          <button
            disabled={isLoading}
            onClick={RemoveToFavorite}
            className="w-14 h-14 group flex items-center justify-center rounded-[30px] cursor-pointer bg-primary-100"
          >
            <Heart size="20" color="#E45B00" variant="Bulk" />
          </button>
        )}
        {session?.user && !isFavorite && (
          <button
            disabled={isLoading}
            onClick={AddToFavorite}
            className="w-14 h-14 group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500"
          >
            <Heart
              size="20"
              className='"stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500'
              variant="Bulk"
            />
          </button>
        )}
        {!session?.user && (
          <Dialog>
            <DialogTrigger>
              <span className="w-14 h-14 group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
                <Heart
                  size="20"
                  className='"stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500'
                  variant="Bulk"
                />
              </span>
            </DialogTrigger>
            <NoAuthDialog callbackUrl={pathname} />
          </Dialog>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <span className="w-14 h-14 group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
              <MoreCircle variant={"Bulk"} color={"#737C8A"} size={20} />
            </span>
          </PopoverTrigger>
          <PopoverContent
            className={
              "bg-neutral-100 border border-neutral-200 right-8 p-4 pb-8 w-92  mb-8 rounded-2xl shadow-xl bottom-full flex flex-col gap-4"
            }
          >
            <span
              className={
                "font-medium py-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8"
              }
            >
              {t("more")}
            </span>
            <ReportEventComponent event={event} />
            <div className="h-px bg-neutral-200 w-full"></div>
            <ReportOrganisationComponent event={event} />
          </PopoverContent>
        </Popover>
      </div>
      {session?.user ? (
        <LinkPrimary
          href={`/explore/${slugify(event.eventName, event.eventId)}/checkout`}
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
          <NoAuthDialog
            callbackUrl={`/explore/${slugify(event.eventName, event.eventId)}/checkout`}
          />
        </Dialog>
      )}
    </div>
  );
}
