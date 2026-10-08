import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { User, UserPreference } from "@ticketwaze/typescript-config";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import AccountContent from "./AccountContent";

export default async function AccountPage() {
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": locale,
      Authorization: `Bearer ${session?.user.accessToken}`,
      origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
    },
  });
  const data = await request.json().catch(() => null);
  if (!request.ok || !data?.user || !data?.userPreferences) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  return (
    <OrganizerLayout title="">
      <AccountContent
        user={data.user as User}
        preferences={data.userPreferences as UserPreference}
        profileUrl={`${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/profile`}
      />
    </OrganizerLayout>
  );
}
