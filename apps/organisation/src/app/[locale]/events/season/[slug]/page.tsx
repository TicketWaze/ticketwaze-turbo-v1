import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import BackButton from "@/components/shared/BackButton";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { extractIdFromSlug } from "@/lib/Slugify";
import { loadSeason } from "@/lib/seasons";
import SeasonPageDetails from "./SeasonPageDetails";

/** The organiser's page for one season: its details and every match. */
export default async function SeasonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("Events.season");
  const session = await auth();
  const policy = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  );

  let seasonId: string;
  try {
    seasonId = extractIdFromSlug(slug);
  } catch {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const loaded = await loadSeason(seasonId);
  if (loaded.status === "forbidden") return <UnauthorizedView />;
  if (loaded.status === "failed") {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <SeasonPageDetails
        season={loaded.season}
        matches={loaded.matches}
        canCreate={policy.createEvent()}
        canEdit={policy.editEvent()}
      />
    </OrganizerLayout>
  );
}
