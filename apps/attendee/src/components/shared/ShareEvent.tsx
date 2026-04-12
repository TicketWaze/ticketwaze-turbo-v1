"use client";
import { Link } from "@/i18n/navigation";
import TruncateUrl from "@/lib/TruncateUrl";
import { Copy, Send2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Image from "next/image";
import Whatsapp from "@/assets/icons/whatsApp.svg";
import Twitter from "@/assets/icons/twitter.svg";
import Linkedin from "@/assets/icons/linkedIn.svg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { slugify } from "@/lib/Slugify";
import { Event } from "@ticketwaze/typescript-config";

export default function ShareEvent({ event }: { event: Event }) {
  const t = useTranslations("Event");
  const currentUrl = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/explore/${slugify(event.eventName, event.eventId)}`;
  return (
    <Dialog>
      <DialogTrigger>
        <span className="px-6 py-[7.5px] border-2 border-transparent rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center gap-4 bg-neutral-100 text-neutral-700">
          <Send2 variant={"Bulk"} color={"#737C8A"} size={20} />
          <span className="hidden lg:inline">{t("share")}</span>
        </span>
      </DialogTrigger>
      <DialogContent className={"w-xl lg:w-208 "}>
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
            }
          >
            {t("share")}
          </DialogTitle>
          <DialogDescription className={"sr-only"}>
            <span>Share event</span>
          </DialogDescription>
        </DialogHeader>
        <div
          className={"flex flex-col w-auto justify-center items-center gap-12"}
        >
          <p
            className={
              "font-sans text-[1.8rem] leading-10 text-[#cdcdcd] text-center w-[320px] lg:w-full"
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
              className={"lg:hidden text-neutral-700 text-[1.8rem] max-w-134"}
            >
              {TruncateUrl(currentUrl, 22)}
            </span>
            <span
              className={
                "hidden lg:block text-neutral-700 text-[1.8rem] max-w-134"
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
                "border-2 border-primary-500 px-6 py-[.7rem] rounded-[10rem] font-normal text-[1.5rem] text-primary-500 leading-8 bg-primary-50 cursor-pointer flex"
              }
            >
              <Copy size="20" color="#e45b00" variant="Bulk" />
              {t("copy")}
            </button>
          </div>
          <div className="flex w-full justify-center items-center gap-12">
            <Link
              href={`https://wa.me/?text=${encodeURIComponent(`*Check this out — it’s worth your time!* \nSomething exciting is happening and I wanted you to be part of it.\nTap the link to explore - Reserve your spot now! \n${currentUrl}`)}`}
              target="_blank"
              className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
            >
              <Image src={Whatsapp} alt="whatsapp Icon" />
            </Link>
            <Link
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `Check this out — it’s worth your time! 🚀\nSomething exciting is happening and I wanted you to be part of it.\nReserve your spot now: ${currentUrl}`,
              )}`}
              target="_blank"
              className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
            >
              <Image src={Twitter} alt="Twitter Icon" />
            </Link>
            <Link
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
            >
              <Image src={Linkedin} alt="LinkedIn Icon" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
