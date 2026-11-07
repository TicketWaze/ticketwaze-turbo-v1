import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import SeasonForm from "@/components/season/SeasonForm";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { auth } from "@/lib/auth";
import { extractIdFromSlug } from "@/lib/Slugify";
import { loadSeason } from "@/lib/seasons";

export default async function EditSeasonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).editEvent();
  if (!authorized) return <UnauthorizedView />;

  let loaded: Awaited<ReturnType<typeof loadSeason>>;
  try {
    loaded = await loadSeason(extractIdFromSlug(slug));
  } catch {
    loaded = { status: "failed" };
  }
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
      <SeasonForm season={loaded.season} passType={loaded.passTypes[0]} />
    </OrganizerLayout>
  );
}
