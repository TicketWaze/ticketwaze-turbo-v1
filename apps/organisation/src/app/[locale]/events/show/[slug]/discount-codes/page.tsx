import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import DiscountPageContent from "./DiscountPageContent";
import { Event } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";
import { extractIdFromSlug } from "@/lib/Slugify";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { auth } from "@/lib/auth";

export default async function DiscountCode({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("Events.single_event.discount");
  const { slug } = await params;
  const eventId = extractIdFromSlug(slug);
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/events/${eventId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
    },
  );
  if (eventRequest.status === 403) {
    return <UnauthorizedView />;
  }
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  return (
    <OrganizerLayout title="Discount codes">
      <BackButton text={t("back")} />
      <DiscountPageContent event={event} />
    </OrganizerLayout>
  );
}
