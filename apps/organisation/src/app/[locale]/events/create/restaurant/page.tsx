import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import CreateRestaurantForm from "./CreateRestaurantForm";

export default async function CreateRestaurantPage() {
  const t = await getTranslations("Events.create_event.restaurant");
  const locale = await getLocale();
  const session = await auth();

  // Authorize against the member's effective permissions (role default OR
  // custom grant), matching the API and the raffle page.
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) {
    return <UnauthorizedView />;
  }

  /**
   * Restaurants need a PAID Pro+ plan, and the API enforces that on create.
   * Checking here too so an org on the free plan or in a trial is not walked
   * through this very long form only to be refused on submit. Sent back to the
   * activity picker rather than to a dead end: the restaurant card there is
   * locked and opens the upgrade dialog.
   */
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation?.organisationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
    },
  ).catch(() => null);
  const response = await request?.json().catch(() => null);
  if ((response?.paidTierName ?? "free") === "free") {
    redirect({ href: "/events/create", locale });
  }

  return (
    <OrganizerLayout title={t("title")}>
      <CreateRestaurantForm />
    </OrganizerLayout>
  );
}
