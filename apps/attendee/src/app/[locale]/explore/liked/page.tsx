import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import SignedOutState from "@/components/SignedOutState";
import { auth } from "@/lib/auth";
import { Event } from "@ticketwaze/typescript-config";
import { getTranslations } from "next-intl/server";
import SavedPageContent from "./SavedPageContent";

// "Saved Activities" (Figma "Saved events"). The API calls them favorites;
// the route keeps its old /liked path so existing links still work.
export default async function SavedPage() {
  const t = await getTranslations("Liked");
  const session = await auth();
  if (!session?.user) {
    return (
      <AttendeeLayout title={t("title")}>
        <SignedOutState page="saved" title={t("title")} />
      </AttendeeLayout>
    );
  }
  let events: Event[] = [];
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/favorites`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );
    const response = await request.json();
    events = Array.isArray(response?.events) ? response.events : [];
  } catch (error) {
    console.error("Failed to load saved activities:", error);
  }
  return (
    <AttendeeLayout title={t("title")}>
      <SavedPageContent events={events} />
    </AttendeeLayout>
  );
}
