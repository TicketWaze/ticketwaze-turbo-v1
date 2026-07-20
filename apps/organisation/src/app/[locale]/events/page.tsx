import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import EventPageContent from "./EventPageContent";
import { auth } from "@/lib/auth";
import TopBar from "@/components/shared/TopBar";
import { LinkPrimary } from "@/components/shared/Links";
import { Link } from "@/i18n/navigation";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { checkPermission } from "@/lib/role/permission";

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
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  const events = await request.json();

  // Raffles live in their own table but share the activities list with events.
  let raffles = [];
  try {
    const rafflesRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${session?.activeOrganisation.organisationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        cache: "no-store",
      },
    );
    const rafflesResponse = await rafflesRequest.json();
    raffles = rafflesResponse.raffles ?? [];
  } catch {
    raffles = [];
  }
  // Restaurants are the third activity type and share the activities list.
  let restaurants = [];
  try {
    const restaurantsRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/restaurants/${session?.activeOrganisation.organisationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        cache: "no-store",
      },
    );
    const restaurantsResponse = await restaurantsRequest.json();
    restaurants = restaurantsResponse.restaurants ?? [];
  } catch {
    restaurants = [];
  }

  const perms = session?.activeOrganisation?.myPermissions ?? [];
  const canCreate = checkPermission(perms, "events.create");
  return (
    <OrganizerLayout title={t("title")}>
      <TopBar title={t("title")}>
        {canCreate && (
          <>
            <LinkPrimary className="hidden lg:block" href="/events/create">
              {t("create")}
            </LinkPrimary>
            <Link
              className="lg:hidden fixed bottom-43 right-10 z-50 bg-primary-500 rounded-full px-10 py-5 flex items-center justify-center text-white text-[1.4rem] font-medium leading-8 shadow-lg"
              href="/events/create"
            >
              {t("create_short")}
            </Link>
          </>
        )}
      </TopBar>
      <EventPageContent
        events={events.events}
        raffles={raffles}
        restaurants={restaurants}
      />
    </OrganizerLayout>
  );
}
