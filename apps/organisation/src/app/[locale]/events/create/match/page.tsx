/* eslint-disable @typescript-eslint/no-explicit-any */
import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import type { PastVenue } from "@/lib/pastVenue";
import CreateInPersonEventForm from "../in-person/[eventType]/CreateInPersonEventForm";

/**
 * CREATE A MATCH (the Match card). A match is an in-person event with two
 * teams, one day, filed under Sport. No seasons (2026-11-09): matches are
 * grouped afterwards under a multi-match ticket. KYC is enforced by the
 * create layout.
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
  const [meRequest, venuesBody] = await Promise.all([
    fetch(`${api}/organisations/me/${organisationId}`, { headers }).catch(
      () => null,
    ),
    // Where the club has played: prefilled and offered on the form.
    fetch(`${api}/seasons/${organisationId}/venues`, {
      headers,
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);
  if (meRequest?.status === 403) return <UnauthorizedView />;
  const me: any = meRequest?.ok
    ? await meRequest.json().catch(() => null)
    : null;
  if (!me?.membershipTier) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout title="">
      <CreateInPersonEventForm
        eventType=""
        membershipTier={me.membershipTier}
        isMatch
        pastVenues={(venuesBody?.venues ?? []) as PastVenue[]}
      />
    </OrganizerLayout>
  );
}
