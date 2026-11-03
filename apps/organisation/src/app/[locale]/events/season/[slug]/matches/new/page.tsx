import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import KycGateView from "@/components/kyc/KycGateView";
import { getKycAccess } from "@/lib/kycServer";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import { extractIdFromSlug } from "@/lib/Slugify";
import { loadSeason } from "@/lib/seasons";
import { getLocale } from "next-intl/server";
import CreateInPersonEventForm from "../../../../create/in-person/[eventType]/CreateInPersonEventForm";

/**
 * ADD A MATCH. A match is an in-person event, so this is the ordinary event
 * wizard started from the season: teams first, venue and cover prefilled.
 * Locked behind KYC like every other create (the API refuses too).
 */
export default async function NewMatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const locale = await getLocale();
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).createEvent();
  if (!authorized) return <UnauthorizedView />;

  const kyc = await getKycAccess();
  if (kyc && kyc.status !== "approved") {
    return (
      <OrganizerLayout title="">
        <KycGateView
          action="create"
          status={kyc.status}
          canVerify={kyc.canVerify}
        />
      </OrganizerLayout>
    );
  }

  let seasonId: string | null = null;
  try {
    seasonId = extractIdFromSlug(slug);
  } catch {
    seasonId = null;
  }
  const organisationId = session?.activeOrganisation?.organisationId;
  const [loaded, meRequest] = await Promise.all([
    seasonId ? loadSeason(seasonId) : Promise.resolve({ status: "failed" as const }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${organisationId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
      },
    }).catch(() => null),
  ]);
  if (loaded.status === "forbidden" || meRequest?.status === 403) {
    return <UnauthorizedView />;
  }
  const me = meRequest?.ok ? await meRequest.json().catch(() => null) : null;
  if (loaded.status !== "ok" || !me?.membershipTier) {
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
        season={loaded.season}
      />
    </OrganizerLayout>
  );
}
