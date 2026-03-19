import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import EditInPersonEventForm from "./EditInPersonEventForm";
import { Event } from "@ticketwaze/typescript-config";

export default async function EditEvent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${slug}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;
  return (
    <OrganizerLayout title="Edit Event">
      <EditInPersonEventForm event={event} />
    </OrganizerLayout>
  );
}
