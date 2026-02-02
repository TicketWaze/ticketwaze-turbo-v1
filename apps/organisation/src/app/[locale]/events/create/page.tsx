import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import EventTypeList from "./EventTypeList";
import { auth } from "@/lib/auth";
import { Organisation } from "@ticketwaze/typescript-config";

export default async function CreatePage() {
  const t = await getTranslations("Events.create_event");
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation.organisationId}`,
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
  const response = await request.json();
  const organisation: Organisation = response.organisation;
  return (
    <OrganizerLayout title={t("title")}>
      <EventTypeList organisation={organisation} />
    </OrganizerLayout>
  );
}
