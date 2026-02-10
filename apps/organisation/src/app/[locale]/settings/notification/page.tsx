import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations, getLocale } from "next-intl/server";
import NotificationForm from "./NotificationForm";
import { auth } from "@/lib/auth";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { organisationPolicy } from "@/lib/role/organisationPolicy";

export default async function Page() {
  const t = await getTranslations("Settings.notification");
  const locale = await getLocale();
  const session = await auth();
  const authorized = await organisationPolicy.updateOrganisationInformations(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );
  const organisation = session?.activeOrganisation;
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${organisation?.organisationId}/notifications-preferences`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        Authorization: `Bearer ${session?.user.accessToken}`,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
    },
  );
  const notificationPreferences = await request.json();
  return (
    <OrganizerLayout title={t("title")}>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")} />
      </div>
      <NotificationForm
        notificationPreferences={notificationPreferences.preferences}
        authorized={authorized}
      />
    </OrganizerLayout>
  );
}
