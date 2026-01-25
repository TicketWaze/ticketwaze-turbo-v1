import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import DiscountPageContent from "./DiscountPageContent";
import { Event } from "@ticketwaze/typescript-config";
import BackButton from "@/components/shared/BackButton";

export default async function DiscountCode({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = await getTranslations("Events.single_event.discount");
  const { slug } = await params;
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${slug}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  return (
    <OrganizerLayout title="Discount codes">
      <BackButton text={t("back")} />
      <DiscountPageContent event={event} />
    </OrganizerLayout>
  );
}
