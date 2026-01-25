import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import ProfileImage from "./ProfileImage";
import UserProfileForm from "./UserProfileForm";
import FormatDate from "@/lib/FormatDate";
import {
  User,
  UserAnalytic,
  UserPreference,
} from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary, ButtonRed } from "@/components/shared/buttons";
import AppLanguage from "./AppLanguage";

export default async function AccountPage() {
  const t = await getTranslations("Settings.account");
  const locale = await getLocale();
  const session = await auth();
  const accessToken = session?.user.accessToken;
  const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": locale,
      Authorization: `Bearer ${session?.user.accessToken}`,
      origin: process.env.NEXT_PUBLIC_ORANISATION_URL!,
    },
  });
  const data = await request.json();
  const user: User = await data.user;
  const userAnalytic: UserAnalytic = await data.userAnalytic;
  const userPreferences: UserPreference = await data.userPreferences;
  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")}>
          <ButtonPrimary form="user-form">{t("save")}</ButtonPrimary>
        </TopBar>
      </div>

      <div
        className={
          "flex flex-col justify-between gap-[40px] w-full lg:w-[530px] mx-auto overflow-y-scroll overflow-x-hidden h-full"
        }
      >
        <ProfileImage user={user} />

        <UserProfileForm user={user} accessToken={accessToken ?? ""} />
        <AppLanguage userPreferences={userPreferences} />
        {/* event */}
        <div className={"flex flex-col gap-8"}>
          <span
            className={
              "pb-4 font-medium text-[1.8rem] leading-[25px] text-deep-100"
            }
          >
            {t("event.title")}
          </span>
          <div className={"flex items-center justify-between"}>
            <p
              className={
                "font-normal text-[1.6rem] leading-[22px] text-neutral-600"
              }
            >
              {t("event.attended")}
            </p>
            <span
              className={"font-medium text-[1.6rem] leading-8 text-deep-100"}
            >
              {userAnalytic.eventAttended}
            </span>
          </div>
          <div className={"h-[1px] w-full bg-neutral-100"}></div>
          <div className={"flex items-center justify-between"}>
            <p
              className={
                "font-normal text-[1.6rem] leading-[22px] text-neutral-600"
              }
            >
              {t("event.tickets")}
            </p>
            <span
              className={"font-medium text-[1.6rem] leading-8 text-deep-100"}
            >
              {userAnalytic.ticketPurchased}
            </span>
          </div>
          <div className={"h-[1px] w-full bg-neutral-100"}></div>
          <div className={"flex items-center justify-between"}>
            <p
              className={
                "font-normal text-[1.6rem] leading-[22px] text-neutral-600"
              }
            >
              {t("event.missed")}
            </p>
            <span
              className={"font-medium text-[1.6rem] leading-8 text-deep-100"}
            >
              {userAnalytic.eventMissed}
            </span>
          </div>
        </div>
        {/* account */}
        <div className={"flex flex-col gap-12"}>
          <span
            className={
              " font-medium text-[1.8rem] leading-[25px] text-deep-100"
            }
          >
            {t("account.title")}
          </span>
          <div className={"flex items-center justify-between"}>
            <p
              className={
                "font-normal text-[1.6rem] leading-[22px] text-neutral-600"
              }
            >
              {t("account.created")}
            </p>
            <span
              className={"font-medium text-[1.6rem] leading-8 text-deep-100"}
            >
              {FormatDate(user.createdAt)}
            </span>
          </div>
          <ButtonRed>{t("account.delete")}</ButtonRed>
        </div>
        <div className="hidden lg:block"></div>
      </div>
    </OrganizerLayout>
  );
}
