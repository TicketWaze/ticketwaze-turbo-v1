import SignedOutState from "@/components/SignedOutState";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { SimpleTopbar } from "@/components/Layouts/Topbars";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { User, UserPreference } from "@ticketwaze/typescript-config";
import SettingsContent from "./SettingsContent";

export default async function SettingsPage() {
  const t = await getTranslations("Settings");
  const session = await auth();
  if (!session) {
    return (
      <AttendeeLayout title={t("title")}>
        <SignedOutState page="settings" title={t("title")} />
      </AttendeeLayout>
    );
  }
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.user.accessToken}`,
  };
  const [meResponse, preferencesResponse] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers,
      cache: "no-store",
    }).then((r) => r.json().catch(() => null)),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`, {
      headers,
      cache: "no-store",
    }).then((r) => r.json().catch(() => null)),
  ]);
  const user: (User & { mfaEnabled?: boolean }) | undefined = meResponse?.user;
  const preferences: UserPreference | undefined =
    preferencesResponse?.preferences;
  if (!user || !preferences) {
    throw new Error("Could not load settings");
  }

  return (
    <AttendeeLayout title={t("title")}>
      <SimpleTopbar title={t("title")} />
      <div className="flex flex-col w-full lg:w-212 mx-auto lg:overflow-y-scroll lg:overflow-x-hidden lg:h-full">
        <SettingsContent
          hasPassword={Boolean(user.hasPassword)}
          mfaEnabled={Boolean(user.mfaEnabled)}
          preferences={preferences}
        />
      </div>
    </AttendeeLayout>
  );
}
