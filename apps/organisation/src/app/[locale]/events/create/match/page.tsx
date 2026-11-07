/* eslint-disable @typescript-eslint/no-explicit-any */
import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { Season } from "@ticketwaze/typescript-config";
import CreateInPersonEventForm from "../in-person/[eventType]/CreateInPersonEventForm";

/**
 * CREATE A MATCH (the Match card). A match is an in-person event with two
 * teams. Joining a season is optional and asked on the form's first step:
 * an existing season, a new one (created with this match and a second), or
 * none. KYC is enforced by the create layout.
 */
export default async function CreateMatchPage() {
  const session = await auth();
  const locale = await getLocale();
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) return <UnauthorizedView />;

  const organisationId = session?.activeOrganisation.organisationId;
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.user.accessToken}`,
    "Accept-Language": locale,
    origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
  };
  const api = process.env.NEXT_PUBLIC_API_URL;
  const [seasonsRequest, meRequest] = await Promise.all([
    fetch(`${api}/seasons/${organisationId}`, { headers, cache: "no-store" }).catch(
      () => null,
    ),
    fetch(`${api}/organisations/me/${organisationId}`, { headers }).catch(
      () => null,
    ),
  ]);
  if (seasonsRequest?.status === 403 || meRequest?.status === 403) {
    return <UnauthorizedView />;
  }
  const body: any = seasonsRequest?.ok
    ? await seasonsRequest.json().catch(() => null)
    : null;
  const me: any = meRequest?.ok ? await meRequest.json().catch(() => null) : null;
  if (!body?.seasons || !me?.membershipTier) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  // A rejected or suspended season takes no new match.
  const seasons = (body.seasons as Season[]).filter(
    (season) => season.adminStatus !== "rejected" && !season.suspendedAt,
  );

  return (
    <OrganizerLayout title="">
      <CreateInPersonEventForm
        eventType=""
        membershipTier={me.membershipTier}
        seasons={seasons}
      />
    </OrganizerLayout>
  );
}
