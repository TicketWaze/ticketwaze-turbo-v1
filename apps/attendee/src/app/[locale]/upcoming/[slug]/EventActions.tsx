"use client";
import {
  AddEventToFavorite,
  RemoveEventToFavorite,
} from "@/actions/eventActions";
import { usePathname } from "@/i18n/navigation";
import Slugify from "@/lib/Slugify";
import TruncateUrl from "@/lib/TruncateUrl";
import { Copy, Heart, MoreCircle, Send2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import ReportEventComponent from "../../explore/[slug]/ReportEventComponent";
import ReportOrganisationComponent from "../../explore/[slug]/ReportOrganisationComponent";
import { Event, User } from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function EventActions({
  event,
  user,
  isFavorite,
}: {
  event: Event;
  user: User;
  isFavorite: boolean;
}) {
  const t = useTranslations("Event");
  const pathname = usePathname();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  async function AddToFavorite() {
    setIsLoading(true);
    const result = await AddEventToFavorite(
      user.accessToken,
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
      user.accessToken,
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
        <Dialog>
          <DialogTrigger>
            <span className="px-[15px] py-[7.5px] border-2 border-transparent rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-[20px] cursor-pointer transition-all duration-400 flex items-center justify-center gap-4 bg-neutral-100 text-neutral-700">
              <Send2 variant={"Bulk"} color={"#737C8A"} size={20} />
              <span className="hidden lg:inline">{t("share")}</span>
            </span>
          </DialogTrigger>
          <DialogContent className={"w-[360px] lg:w-[520px] "}>
            <DialogHeader>
              <DialogTitle
                className={
                  "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
                }
              >
                {t("share")}
              </DialogTitle>
              <DialogDescription className={"sr-only"}>
                <span>Share event</span>
              </DialogDescription>
            </DialogHeader>
            <div
              className={
                "flex flex-col w-auto justify-center items-center gap-[30px]"
              }
            >
              <p
                className={
                  "font-sans text-[1.8rem] leading-[25px] text-[#cdcdcd] text-center w-[320px] lg:w-full"
                }
              >
                {t("share_text")}
              </p>
              <div
                className={
                  "border w-auto border-neutral-100 rounded-[100px] p-4 flex  items-center gap-4"
                }
              >
                <span
                  className={
                    "lg:hidden text-neutral-700 text-[1.8rem] max-w-[335px]"
                  }
                >
                  {TruncateUrl(
                    event.eventType === "private"
                      ? `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/private/${Slugify(event.eventName)}`
                      : `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/${Slugify(event.eventName)}`,
                    22,
                  )}
                </span>
                <span
                  className={
                    "hidden lg:block text-neutral-700 text-[1.8rem] max-w-[335px]"
                  }
                >
                  {TruncateUrl(
                    event.eventType === "private"
                      ? `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/private/${Slugify(event.eventName)}`
                      : `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/${Slugify(event.eventName)}`,
                  )}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        event.eventType === "private"
                          ? `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/private/${Slugify(event.eventName)}`
                          : `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/explore/${Slugify(event.eventName)}`,
                      );
                      toast.success("Url copied to clipboard");
                    } catch (e) {
                      toast.error("Failed to copy url");
                    }
                  }}
                  className={
                    "border-2 border-primary-500 px-[15px] py-[7px] rounded-[10rem] font-normal text-[1.5rem] text-primary-500 leading-[20px] bg-primary-50 cursor-pointer flex"
                  }
                >
                  <Copy size="20" color="#e45b00" variant="Bulk" />
                  {t("copy")}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {isFavorite ? (
          <button
            disabled={isLoading}
            onClick={RemoveToFavorite}
            className="w-[35px] h-[35px] group flex items-center justify-center rounded-[30px] cursor-pointer bg-primary-100"
          >
            <Heart size="20" color="#E45B00" variant="Bulk" />
          </button>
        ) : (
          <button
            disabled={isLoading}
            onClick={AddToFavorite}
            className="w-[35px] h-[35px] group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500"
          >
            <Heart
              size="20"
              className='"stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500'
              variant="Bulk"
            />
          </button>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <span className="w-[35px] h-[35px] group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
              <MoreCircle variant={"Bulk"} color={"#737C8A"} size={20} />
              {/* {t('more')} */}
            </span>
          </PopoverTrigger>
          <PopoverContent
            className={
              "bg-neutral-100 border border-neutral-200 right-8 p-4 pb-8 w-[230px]  mb-8 rounded-[1rem] shadow-xl bottom-full flex flex-col gap-4"
            }
          >
            <span
              className={
                "font-medium py-[5px] border-b-[1px] border-neutral-200 text-[1.4rem] text-deep-100 leading-[20px]"
              }
            >
              {t("more")}
            </span>

            <ReportEventComponent event={event} />
            <div className="h-[1px] bg-neutral-200 w-full"></div>
            <ReportOrganisationComponent event={event} />
          </PopoverContent>
        </Popover>
      </div>
      {/* {isFree ? null : (
        <LinkPrimary href={`/explore/${Slugify(event.eventName)}/checkout`}>
          {t("buy_more")}
        </LinkPrimary>
      )} */}
    </div>
  );
}
