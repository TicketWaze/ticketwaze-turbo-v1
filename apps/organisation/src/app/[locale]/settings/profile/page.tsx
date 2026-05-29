import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations, getLocale } from "next-intl/server";
import ProfileImage from "./ProfileImage";
import ProfileForm from "./ProfileForm";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import CurrencyPreference from "./CurrencyPreference";
import { auth } from "@/lib/auth";
import { MembershipTier, Organisation } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";

export default async function ProfilePage() {
  const t = await getTranslations("Settings.profile");
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation.organisationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  const response = await request.json();
  const organisation: Organisation = response.organisation;
  const membershipTier: MembershipTier = response.membershipTier;
  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")} />
      </div>
      <div
        className={
          "flex flex-col gap-16 w-full lg:w-212 mx-auto overflow-y-scroll overflow-x-hidden h-full"
        }
      >
        <ProfileImage />
        <ProfileForm
          organisation={organisation}
          membershipTier={membershipTier}
        />
        <CurrencyPreference organisation={organisation} />
        <div></div>
      </div>
    </OrganizerLayout>
  );
}
