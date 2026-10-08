import SignedOutState from "@/components/SignedOutState";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { getLocale, getTranslations } from "next-intl/server";
import ProfilePageContent from "./ProfilePageContent";
import { auth } from "@/lib/auth";

export default async function ProfilePage({
  searchParams,
}: {
  // `?edit=1` (the profile reminder email and bell) opens the edit mode.
  searchParams: Promise<{ edit?: string }>;
}) {
  const t = await getTranslations("Profile");
  const locale = await getLocale();
  const { edit } = await searchParams;
  const session = await auth();
  if (!session) {
    return (
      <AttendeeLayout title={t("title")}>
        <SignedOutState page="profile" title={t("title")} />
      </AttendeeLayout>
    );
  }
  const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": locale,
      Authorization: `Bearer ${session?.user.accessToken}`,
    },
  });
  const response = await request.json();
  return (
    <AttendeeLayout title={t("title")}>
      <ProfilePageContent
        analytics={response.userAnalytic}
        user={response.user}
        startEditing={edit === "1"}
      />
    </AttendeeLayout>
  );
}
