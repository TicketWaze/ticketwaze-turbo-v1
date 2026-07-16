"use client";
import {
  AddEventToFavorite,
  RemoveEventToFavorite,
} from "@/actions/eventActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import BuyTicketAuthDialog from "../../[slug]/BuyTicketAuthDialog";
import ReportEventComponent from "../../[slug]/ReportEventComponent";
import ReportOrganisationComponent from "../../[slug]/ReportOrganisationComponent";
import ShareEvent from "@/components/shared/ShareEvent";
import { usePathname } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { Heart, MoreCircle } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Raffle } from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LinkPrimary } from "@/components/shared/Links";

export default function RaffleActions({
  raffle,
  soldOut,
  isFavorite,
}: {
  raffle: Raffle;
  soldOut: boolean;
  isFavorite: boolean;
}) {
  const t = useTranslations("Event");
  const rt = useTranslations("Raffle");
  const locale = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [fav, setFav] = useState(isFavorite);

  const slug = slugify(raffle.title, raffle.raffleId);
  const raffleUrl = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/explore/raffle/${slug}`;
  const checkoutUrl = `/explore/raffle/${slug}/checkout`;

  async function addFavorite() {
    setIsLoading(true);
    const result = await AddEventToFavorite(
      session?.user?.accessToken as string,
      raffle.raffleId,
      raffle.organisationId,
      pathname,
      locale,
    );
    if (result.error) toast.error(result.message);
    else setFav(true);
    setIsLoading(false);
  }
  async function removeFavorite() {
    setIsLoading(true);
    const result = await RemoveEventToFavorite(
      session?.user?.accessToken as string,
      raffle.raffleId,
      pathname,
      locale,
    );
    if (result.error) toast.error(result.message);
    else setFav(false);
    setIsLoading(false);
  }

  return (
    <div className="flex items-center justify-between">
      <PageLoader isLoading={isLoading} />
      <div className="flex gap-8">
        <ShareEvent url={raffleUrl} />
        {session?.user && fav && (
          <button
            disabled={isLoading}
            onClick={removeFavorite}
            className="p-[7.5px] group flex items-center justify-center rounded-[30px] cursor-pointer bg-primary-100"
          >
            <Heart width={20} height={20} color="#E45B00" variant="Bulk" />
          </button>
        )}
        {session?.user && !fav && (
          <button
            disabled={isLoading}
            onClick={addFavorite}
            className="w-fit h-fit p-[7.5px] group flex items-center justify-center bg-neutral-100 rounded-full cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500"
          >
            <Heart
              width={20}
              height={20}
              className="stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500"
              variant="Bulk"
            />
          </button>
        )}
        {!session?.user && (
          <Dialog>
            <DialogTrigger>
              <span className="w-fit h-fit p-[7.5px] group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
                <Heart
                  width={20}
                  height={20}
                  className="stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500"
                  variant="Bulk"
                />
              </span>
            </DialogTrigger>
            <NoAuthDialog callbackUrl={pathname} />
          </Dialog>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <span className="w-fit h-fit p-[7.5px] group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
              <MoreCircle
                variant={"Bulk"}
                color={"#737C8A"}
                width={20}
                height={20}
              />
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
            <ReportEventComponent
              activityId={raffle.raffleId}
              organisationId={raffle.organisationId}
            />
            <div className="h-px bg-neutral-200 w-full"></div>
            <ReportOrganisationComponent
              organisationId={raffle.organisationId}
            />
          </PopoverContent>
        </Popover>
      </div>
      {soldOut ? (
        <span className="px-12 py-6 rounded-[100px] text-center text-neutral-600 font-medium text-[1.5rem] leading-8 flex items-center justify-center bg-neutral-100">
          {rt("soldOut")}
        </span>
      ) : session?.user ? (
        <LinkPrimary
          href={checkoutUrl}
          className="py-[7.5px] px-12 text-[1.5rem] font-semibold tracking-[-0.50px] normal font-sans"
        >
          {rt("buyEntries")}
        </LinkPrimary>
      ) : (
        <Dialog>
          <DialogTrigger>
            <span className="px-12 py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center bg-primary-500 disabled:bg-primary-500/50 hover:bg-primary-500/80 hover:border-primary-600">
              {rt("buyEntries")}
            </span>
          </DialogTrigger>
          <BuyTicketAuthDialog checkoutUrl={checkoutUrl} isPrivate={false} />
        </Dialog>
      )}
    </div>
  );
}
