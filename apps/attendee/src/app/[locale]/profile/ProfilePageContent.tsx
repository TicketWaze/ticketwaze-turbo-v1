"use client";
import { TopBar } from "@/components/Layouts/Topbars";
import { useLocale, useTranslations } from "next-intl";
import ProfileImage from "./ProfileImage";
import FormatDate from "@/lib/FormatDate";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateUserProfile } from "@/actions/userActions";
import { toast } from "sonner";
import { User, UserAnalytic } from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import { Input } from "@/components/shared/Inputs";
import Separator from "@/components/shared/Separator";
import ChangePassword from "./ChangePassword";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import SendIcon from "./send-sqaure-2.svg";
import { useSession } from "next-auth/react";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import Whatsapp from "@/assets/icons/whatsApp.svg";
import Twitter from "@/assets/icons/twitter.svg";
import Linkedin from "@/assets/icons/linkedIn.svg";
import { Copy, Gift } from "iconsax-reactjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import TruncateUrl from "@/lib/TruncateUrl";

export default function ProfilePageContent({
  analytics,
  user,
  accessToken,
}: {
  analytics: UserAnalytic;
  user: User;
  accessToken: string;
}) {
  const t = useTranslations("Profile");

  const EditProfileSchema = z.object({
    firstName: z.string().min(2, { error: t("errors.firstname_length") }),
    lastName: z.string().min(2, { error: t("errors.lastname_length") }),
  });
  type TEditProfileSchema = z.infer<typeof EditProfileSchema>;
  const { data: session, update } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TEditProfileSchema>({
    resolver: zodResolver(EditProfileSchema),
    values: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
  const locale = useLocale();
  async function submitHandler(data: TEditProfileSchema) {
    const results = await UpdateUserProfile(
      session?.user.accessToken ?? "",
      data,
      locale,
    );
    if (results.status !== "success") {
      toast.error(results.error);
      return;
    }
    update({
      user: { firstName: data.firstName, lastName: data.lastName },
    });
  }
  const referralLink = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/auth/register?referral=${session?.user.referralCode}`;
  return (
    <>
      <PageLoader isLoading={isSubmitting} />
      <TopBar title={t("title")}>
        <Dialog>
          <DialogTrigger>
            <span className="px-6 py-[7.5px] border-2 border-transparent rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center gap-4 bg-neutral-100 text-neutral-700">
              <Gift variant={"Bulk"} color={"#E45B00"} size={20} />
              <span className="hidden lg:inline">{t("referralTitle")}</span>
            </span>
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
                <span>Share event</span>
              </DialogDescription>
            </DialogHeader>
            <div
              className={
                "flex flex-col w-auto justify-center items-center gap-12"
              }
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
                  className={
                    "lg:hidden text-neutral-700 text-[1.8rem] max-w-134"
                  }
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
                  href={`https://wa.me/?text=${encodeURIComponent(`*Check this out — it’s worth your time!* \n\nI've been using TicketWaze for tickets to concerts, shows, sports and more. Join me with my referral code and let's experience great moments together!\nTap the link to explore - Reserve your spot now! \n\n${referralLink}`)}`}
                  target="_blank"
                  className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
                >
                  <Image src={Whatsapp} alt="whatsapp Icon" />
                </Link>
                {/* <div className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full">
                      <Image src={Instagram} alt="instagram Icon" />
                    </div> */}
                <Link
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Check this out — it’s worth your time! 🚀\nI've been using TicketWaze for tickets to concerts, shows, sports and more. Join me with my referral code and let's experience great moments together!\nReserve your spot now: ${referralLink}`,
                  )}`}
                  target="_blank"
                  className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
                >
                  <Image src={Twitter} alt="Twitter Icon" />
                </Link>
                {/* <div className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full">
                      <Image src={Tiktok} alt="tiktok Icon" />
                    </div> */}
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
      </TopBar>
      <div
        className={
          "flex flex-col gap-16 w-full lg:w-212 mx-auto overflow-y-scroll overflow-x-hidden h-full"
        }
      >
        <ProfileImage user={user} accessToken={accessToken} />
        <div className="flex flex-col gap-8">
          <span className="font-medium text-[1.8rem] mb-4 leading-10 text-deep-100">
            {t("personal")}
          </span>
          <form
            onSubmit={handleSubmit(submitHandler)}
            id="edit-profile"
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
              <Input
                className="w-full flex-1"
                {...register("firstName")}
                type="text"
                error={errors.firstName?.message}
              >
                {t("placeholders.firstname")}
              </Input>
              <Input
                className="w-full flex-1"
                {...register("lastName")}
                type="text"
                error={errors.lastName?.message}
              >
                {t("placeholders.lastname")}
              </Input>
            </div>
            <Input defaultValue={user.email} disabled readOnly>
              {t("placeholders.email")}
            </Input>
            {/* <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
              <Input
                defaultValue={user.state}
                disabled
                readOnly
                className="w-full flex-1"
              >
                {t("placeholders.state")}
              </Input>
              <Input
                defaultValue={user.city}
                disabled
                readOnly
                className="w-full flex-1"
              >
                {t("placeholders.city")}
              </Input>
            </div> */}
            {/* <Input defaultValue={user.country} disabled readOnly>
              {t("placeholders.country")}
            </Input> */}
            {/* <Input
              defaultValue={FormatDate(user.dateOfBirth, locale, "local")}
              disabled
              readOnly
            >
              {t("placeholders.dob")}
            </Input> */}
            <ButtonPrimary type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? <LoadingCircleSmall /> : t("save")}
            </ButtonPrimary>
          </form>
        </div>
        <ChangePassword />
        <div className="flex flex-col gap-8">
          <span className="font-medium text-[1.8rem] mb-4 leading-10 text-deep-100">
            {t("event.title")}
          </span>
          <div className="flex items-center justify-between">
            <span className="font-normal text-[1.6rem] leading-[22.5px] text-neutral-600">
              {t("event.attended")}
            </span>
            <span className="text-[1.6rem] font-medium leading-8 text-deep-100">
              {analytics.eventAttended}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-normal text-[1.6rem] leading-[22.5px] text-neutral-600">
              {t("event.tickets")}
            </span>
            <span className="text-[1.6rem] font-medium leading-8 text-deep-100">
              {analytics.ticketPurchased}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-normal text-[1.6rem] leading-[22.5px] text-neutral-600">
              {t("event.missed")}
            </span>
            <span className="text-[1.6rem] font-medium leading-8 text-deep-100">
              {analytics.eventMissed}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <span className="font-medium text-[1.8rem] mb-4 leading-10 text-deep-100">
            {t("others.title")}
          </span>
          <Link
            href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/legals`}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-[1.6rem] text-deep-100">
              {t("others.privacy")}
            </span>
            <Image src={SendIcon} alt="Send Icon" />
          </Link>
          <Separator />
          <Link
            href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/legals`}
            className="flex items-center justify-between gap-3"
          >
            <span className="text-[1.6rem] text-deep-100">
              {t("others.terms")}
            </span>
            <Image src={SendIcon} alt="Send Icon" />
          </Link>
        </div>
        <div className="flex flex-col gap-10">
          <span className="font-medium text-[1.8rem] mb-4 leading-10 text-deep-100">
            {t("account.title")}
          </span>
          <div className="flex items-center justify-between">
            <span className="font-normal text-[1.6rem] leading-[22.5px] text-neutral-600">
              {t("account.created")}
            </span>
            <span className="text-[1.6rem] font-medium leading-8 text-deep-100">
              {FormatDate(user.createdAt, locale, "local")}
            </span>
          </div>
          <ButtonRed>{t("account.delete")}</ButtonRed>
        </div>
        <div></div>
      </div>
    </>
  );
}
