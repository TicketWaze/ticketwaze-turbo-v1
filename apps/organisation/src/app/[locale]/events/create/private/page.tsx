import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreatePrivateEventForm from "./CreatePrivateEventForm";

export default async function PrivatePage() {
  return (
    <OrganizerLayout title="Private event">
      <CreatePrivateEventForm />
    </OrganizerLayout>
  );
}
