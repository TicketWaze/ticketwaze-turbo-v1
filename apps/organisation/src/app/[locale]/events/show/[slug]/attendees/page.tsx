import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import AttendeesPageContent from "./AttendeesPageContent";
import { Event } from "@ticketwaze/typescript-config";
import { getTranslations, getLocale } from "next-intl/server";
import BackButton from "@/components/shared/BackButton";
import { auth } from "@/lib/auth";

export default async function Attendees({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Events.single_event.attendees");
  const locale = await getLocale();
  const session = await auth();
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${slug}`,
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
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;

  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <AttendeesPageContent event={event} />
    </OrganizerLayout>
  );
}
