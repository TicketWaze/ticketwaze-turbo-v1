"use client";
import {
  AddEventToFavorite,
  RemoveEventToFavorite,
} from "@/actions/eventActions";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import { Link, usePathname } from "@/i18n/navigation";
import Slugify from "@/lib/Slugify";
import TruncateUrl from "@/lib/TruncateUrl";
import { Copy, Heart, MoreCircle, Send2 } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import Whatsapp from "@/assets/icons/whatsApp.svg";
import Twitter from "@/assets/icons/twitter.svg";
import Linkedin from "@/assets/icons/linkedIn.svg";
import ReportEventComponent from "./ReportEventComponent";
import ReportOrganisationComponent from "./ReportOrganisationComponent";
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
import { LinkPrimary } from "@/components/shared/Links";

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
  const locale = useLocale();
  const [currentUrl, setCurrentUrl] = useState("");
  const { data: session } = useSession();
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const pathname = usePathname();
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
  const eventLink = currentUrl;
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
                  {TruncateUrl(currentUrl, 22)}
                </span>
                <span
                  className={
                    "hidden lg:block text-neutral-700 text-[1.8rem] max-w-[335px]"
                  }
                >
                  {TruncateUrl(currentUrl)}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(currentUrl);
                      toast.success("Url copied to clipboard");
                    } catch {
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
              <div className="flex w-full justify-center items-center gap-12">
                <Link
                  href={`https://wa.me/?text=${encodeURIComponent(`*Check this out — it’s worth your time!* \nSomething exciting is happening and I wanted you to be part of it.\nTap the link to explore - Reserve your spot now! \n${eventLink}`)}`}
                  target="_blank"
                  className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full"
                >
                  <Image src={Whatsapp} alt="whatsapp Icon" />
                </Link>
                {/* <div className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full">
                      <Image src={Instagram} alt="instagram Icon" />
                    </div> */}
                <Link
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Check this out — it’s worth your time! 🚀\nSomething exciting is happening and I wanted you to be part of it.\nReserve your spot now: ${eventLink}`,
                  )}`}
                  target="_blank"
                  className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full"
                >
                  <Image src={Twitter} alt="Twitter Icon" />
                </Link>
                {/* <div className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full">
                      <Image src={Tiktok} alt="tiktok Icon" />
                    </div> */}
                <Link
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventLink)}`}
                  target="_blank"
                  className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full"
                >
                  <Image src={Linkedin} alt="LinkedIn Icon" />
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {session?.user && isFavorite && (
          <button
            disabled={isLoading}
            onClick={RemoveToFavorite}
            className="w-[35px] h-[35px] group flex items-center justify-center rounded-[30px] cursor-pointer bg-primary-100"
          >
            <Heart size="20" color="#E45B00" variant="Bulk" />
          </button>
        )}
        {session?.user && !isFavorite && (
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
        {!session?.user && (
          <Dialog>
            <DialogTrigger>
              <span className="w-[35px] h-[35px] group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
                <Heart
                  size="20"
                  className='"stroke-neutral-700 fill-neutral-700 group-hover:stroke-primary-500 group-hover:fill-primary-500 transition-all ease-in-out duration-500'
                  variant="Bulk"
                />
              </span>
            </DialogTrigger>
            <NoAuthDialog />
          </Dialog>
        )}
        <Popover>
          <PopoverTrigger asChild>
            <span className="w-[35px] h-[35px] group flex items-center justify-center bg-neutral-100 rounded-[30px] cursor-pointer hover:bg-primary-100 transition-all ease-in-out duration-500">
              <MoreCircle variant={"Bulk"} color={"#737C8A"} size={20} />
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
      {session?.user ? (
        <LinkPrimary href={`/explore/${Slugify(event.eventName)}/checkout`}>
          {t("buy")}
        </LinkPrimary>
      ) : (
        <Dialog>
          <DialogTrigger>
            <span className="px-[3rem] py-[15px] border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-[20px] cursor-pointer transition-all duration-400 flex items-center justify-center bg-primary-500 disabled:bg-primary-500/50 hover:bg-primary-500/80 hover:border-primary-600">
              {t("buy")}
            </span>
          </DialogTrigger>
          <NoAuthDialog />
        </Dialog>
      )}
    </div>
  );
}
