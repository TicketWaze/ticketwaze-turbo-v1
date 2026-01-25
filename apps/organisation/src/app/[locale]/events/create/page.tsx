import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import EventTypeList from "./EventTypeList";

export default async function CreatePage() {
  const t = await getTranslations("Events.create_event");
  return (
    <OrganizerLayout title={t("title")}>
      <EventTypeList />
    </OrganizerLayout>
  );
}
