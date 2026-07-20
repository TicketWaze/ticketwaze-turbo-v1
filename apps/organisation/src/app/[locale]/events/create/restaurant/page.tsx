import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import CreateRestaurantForm from "./CreateRestaurantForm";

export default async function CreateRestaurantPage() {
  const t = await getTranslations("Events.create_event.restaurant");
  return (
    <OrganizerLayout title={t("title")}>
      <CreateRestaurantForm />
    </OrganizerLayout>
  );
}
