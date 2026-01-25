import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import EventPageContent from "./EventPageContent";
import { auth } from "@/lib/auth";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import TopBar from "@/components/shared/TopBar";
import { LinkPrimary } from "@/components/shared/Links";

export default async function EventPage() {
  const t = await getTranslations("Events");
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/events`,
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
  const events = await request.json();
  const authorized = await organisationPolicy.viewEvent(
    session?.user.userId!,
    session?.activeOrganisation.organisationId!,
  );
  return (
    <OrganizerLayout title={t("title")}>
      <TopBar title={t("title")}>
        {authorized && (
          <>
            <LinkPrimary className="hidden lg:block" href="/events/create">
              {t("create")}
            </LinkPrimary>
            <LinkPrimary
              className="lg:hidden absolute bottom-40 right-8 "
              href="/events/create"
            >
              {t("create")}
            </LinkPrimary>
          </>
        )}
      </TopBar>
      <EventPageContent events={events.events} />
    </OrganizerLayout>
  );
}
