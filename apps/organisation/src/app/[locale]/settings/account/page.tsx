import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { UserPreference } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import AppLanguage from "./AppLanguage";
import { Link } from "@/i18n/navigation";
import ChangePasswordForm from "./ChangePasswordForm";
import Toggle2Factor from "./Toggle2Factor";

export default async function AccountPage() {
  const t = await getTranslations("Settings.account");
  const locale = await getLocale();
  const session = await auth();
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
  // const user: User = await data.user;
  // const userAnalytic: UserAnalytic = await data.userAnalytic;
  const userPreferences: UserPreference = await data.userPreferences;
  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")} />
      </div>

      <div
        className={
          "flex flex-col justify-between gap-[40px] w-full lg:w-[530px] mx-auto overflow-y-scroll overflow-x-hidden h-full"
        }
      >
        {/* <ProfileImage user={user} /> */}

        {/* <UserProfileForm user={user} accessToken={accessToken ?? ""} /> */}
        <ChangePasswordForm />
        <Toggle2Factor />
        <AppLanguage userPreferences={userPreferences} />
        <div className="flex flex-col gap-4 items-center">
          <p className="font-primary text-[1.4rem] text-neutral-500 text-center">
            {t("profileAlert")}
          </p>
          <Link
            href={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/profile`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 text-[1.4rem] flex gap-2"
          >
            {t("profileLink")}{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </Link>
        </div>
        <div></div>
      </div>
    </OrganizerLayout>
  );
}
