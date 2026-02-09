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
import {
  User,
  UserAnalytic,
  UserPreference,
} from "@ticketwaze/typescript-config";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import { Input } from "@/components/shared/Inputs";
import Separator from "@/components/shared/Separator";
import ChangePassword from "./ChangePassword";
import AppLanguage from "./AppLanguage";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import SendIcon from "./send-sqaure-2.svg";

export default function ProfilePageContent({
  user,
  analytics,
  accessToken,
  userPreferences,
}: {
  user: User;
  analytics: UserAnalytic;
  accessToken: string;
  userPreferences: UserPreference;
}) {
  const t = useTranslations("Profile");

  const EditProfileSchema = z.object({
    firstName: z.string().min(2, { error: t("errors.firstname_length") }),
    lastName: z.string().min(2, { error: t("errors.lastname_length") }),
  });
  type TEditProfileSchema = z.infer<typeof EditProfileSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TEditProfileSchema>({
    resolver: zodResolver(EditProfileSchema),
    values: {
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
  const locale = useLocale();
  async function submitHandler(data: TEditProfileSchema) {
    const results = await UpdateUserProfile(accessToken, data, locale);
    if (results.status !== "success") {
      toast.error(results.error);
    }
  }
  return (
    <>
      <PageLoader isLoading={isSubmitting} />
      <TopBar title={t("title")}>
        <ButtonPrimary form="edit-profile">{t("save")}</ButtonPrimary>
      </TopBar>
      <div
        className={
          "flex flex-col gap-[40px] w-full lg:w-[530px] mx-auto overflow-y-scroll overflow-x-hidden h-full"
        }
      >
        <ProfileImage user={user} accessToken={accessToken} />
        <div className="flex flex-col gap-8">
          <span className="font-medium text-[1.8rem] mb-4 leading-[25px] text-deep-100">
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
            <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
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
            </div>
            <Input defaultValue={user.country} disabled readOnly>
              {t("placeholders.country")}
            </Input>
            <Input
              defaultValue={FormatDate(user.dateOfBirth)}
              disabled
              readOnly
            >
              {t("placeholders.dob")}
            </Input>
          </form>
        </div>
        <ChangePassword />
        <AppLanguage userPreferences={userPreferences} />
        <div className="flex flex-col gap-8">
          <span className="font-medium text-[1.8rem] mb-4 leading-[25px] text-deep-100">
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
          <span className="font-medium text-[1.8rem] mb-4 leading-[25px] text-deep-100">
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
          <span className="font-medium text-[1.8rem] mb-4 leading-[25px] text-deep-100">
            {t("account.title")}
          </span>
          <div className="flex items-center justify-between">
            <span className="font-normal text-[1.6rem] leading-[22.5px] text-neutral-600">
              {t("account.created")}
            </span>
            <span className="text-[1.6rem] font-medium leading-8 text-deep-100">
              {FormatDate(user.createdAt)}
            </span>
          </div>
          <ButtonRed>{t("account.delete")}</ButtonRed>
        </div>
        <div></div>
      </div>
    </>
  );
}
