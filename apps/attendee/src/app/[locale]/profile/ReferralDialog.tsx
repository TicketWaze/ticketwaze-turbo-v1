"use client";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { Copy, Gift } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
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
import TruncateUrl from "@/lib/TruncateUrl";

/** "Invite Friends": the attendee's referral link, to copy or share. */
export default function ReferralDialog() {
  const t = useTranslations("Profile");
  const { data: session } = useSession();
  const referralLink = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/auth/register?referral=${session?.user.referralCode}`;
  return (
    <Dialog>
      <DialogTrigger
        aria-label={t("referralTitle")}
        className="px-6 py-[7.5px] border-2 border-transparent rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-300 flex items-center justify-center gap-4 bg-neutral-100 text-neutral-700 hover:bg-primary-50 active:scale-95"
      >
        <Gift variant={"Bulk"} color={"#E45B00"} size={20} />
        <span className="hidden lg:inline">{t("referralTitle")}</span>
      </DialogTrigger>
      <DialogContent className={"w-xl lg:w-208 "}>
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
            }
          >
            {t("referralTitle")}
          </DialogTitle>
          <DialogDescription className={"sr-only"}>
            {t("referralDescription")}
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
            {t("referralDescription")}
          </p>
          <div
            className={
              "border w-auto border-neutral-100 rounded-[100px] p-4 flex  items-center gap-4"
            }
          >
            <span
              className={"lg:hidden text-neutral-700 text-[1.8rem] max-w-134"}
            >
              {TruncateUrl(referralLink, 22)}
            </span>
            <span
              className={
                "hidden lg:block text-neutral-700 text-[1.8rem] max-w-134"
              }
            >
              {TruncateUrl(referralLink)}
            </span>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(referralLink);
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
              href={`https://wa.me/?text=${encodeURIComponent(`*Check this out — it’s worth your time!* \n\nI've been using Ticketwaze for tickets to concerts, shows, sports and more. Join me with my referral code and let's experience great moments together!\nTap the link to explore - Reserve your spot now! \n\n${referralLink}`)}`}
              target="_blank"
              className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
            >
              <Image src={Whatsapp} alt="whatsapp Icon" />
            </Link>
            <Link
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `Check this out — it’s worth your time! 🚀\nI've been using Ticketwaze for tickets to concerts, shows, sports and more. Join me with my referral code and let's experience great moments together!\nReserve your spot now: ${referralLink}`,
              )}`}
              target="_blank"
              className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
            >
              <Image src={Twitter} alt="Twitter Icon" />
            </Link>
            <Link
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
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
