import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import CreateInPersonEventForm from "./CreateInPersonEventForm";

export default async function InPersonPage() {
  return (
    <OrganizerLayout title="">
      <CreateInPersonEventForm />
    </OrganizerLayout>
  );
}
