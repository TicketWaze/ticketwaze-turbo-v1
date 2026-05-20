import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import EventPageContent from "./EventPageContent";
import { auth } from "@/lib/auth";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import TopBar from "@/components/shared/TopBar";
import { LinkPrimary } from "@/components/shared/Links";
import { Add } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";

export default async function EventPage() {
  const t = await getTranslations("Events");
  const locale = await getLocale();
  const session = await auth();
  const authorized = await organisationPolicy.viewEvents(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );
  if (!authorized) return <UnauthorizedView />;
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
  return (
    <OrganizerLayout title={t("title")}>
      <TopBar title={t("title")}>
        {authorized && (
          <>
            <LinkPrimary className="hidden lg:block" href="/events/create">
              {t("create")}
            </LinkPrimary>
            <Link
              className="lg:hidden absolute bottom-43 right-10 w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center"
              href="/events/create"
            >
              {/* {t("create")} */}
              <Add size="32" color="#ffffff" />
            </Link>
          </>
        )}
      </TopBar>
      <EventPageContent events={events.events} />
    </OrganizerLayout>
  );
}
