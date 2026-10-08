import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale } from "next-intl/server";
import NotificationForm from "./NotificationForm";
import { auth } from "@/lib/auth";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";

export default async function Page() {
  const locale = await getLocale();
  const session = await auth();
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
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  const notificationPreferences = await request.json().catch(() => null);
  if (!request.ok || !notificationPreferences?.preferences) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  return (
    <OrganizerLayout title="">
      <NotificationForm
        notificationPreferences={notificationPreferences.preferences}
      />
    </OrganizerLayout>
  );
}
