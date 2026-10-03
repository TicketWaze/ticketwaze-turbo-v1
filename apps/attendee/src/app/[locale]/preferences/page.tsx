import SignedOutState from "@/components/SignedOutState";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { SimpleTopbar } from "@/components/Layouts/Topbars";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { UserPreference } from "@ticketwaze/typescript-config";
import PreferencesForm from "./PreferencesForm";

export default async function PreferencesPage() {
  const t = await getTranslations("Preferences");
  const session = await auth();
  if (!session) {
    return (
      <AttendeeLayout title={t("title")}>
        <SignedOutState page="preferences" title={t("title")} />
      </AttendeeLayout>
    );
  }
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
      cache: "no-store",
    },
  );
  const response = await request.json().catch(() => null);
  const userPreferences: UserPreference | undefined = response?.preferences;
  if (!userPreferences) {
    throw new Error("Could not load preferences");
  }

  return (
    <AttendeeLayout title={t("title")}>
      <SimpleTopbar title={t("title")} />
      <div
        className={
          "flex flex-col w-full lg:w-212 mx-auto lg:overflow-y-scroll lg:overflow-x-hidden lg:h-full"
        }
      >
        <PreferencesForm userPreferences={userPreferences} />
      </div>
    </AttendeeLayout>
  );
}
