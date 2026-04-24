import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { getLocale, getTranslations } from "next-intl/server";
import ProfilePageContent from "./ProfilePageContent";
import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";

export default async function ProfilePage() {
  const t = await getTranslations("Profile");
  const session = await auth();
  const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.user.accessToken}`,
    },
  });
  const response = await request.json();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  return (
    <AttendeeLayout title={t("title")}>
      <ProfilePageContent
        analytics={response.userAnalytic}
        user={response.user}
        accessToken={session?.user.accessToken as string}
      />
    </AttendeeLayout>
  );
}
