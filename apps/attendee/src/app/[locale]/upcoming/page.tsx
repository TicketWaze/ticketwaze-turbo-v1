import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import UpcomingPageContent from "./UpcomingPageContent";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function UpcomingPage() {
  const session = await auth();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/upcoming`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const eventResponse = await eventRequest.json();
  const events = eventResponse.events;

  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }

  return (
    <AttendeeLayout title="Upcoming">
      <UpcomingPageContent events={events} />
    </AttendeeLayout>
  );
}
