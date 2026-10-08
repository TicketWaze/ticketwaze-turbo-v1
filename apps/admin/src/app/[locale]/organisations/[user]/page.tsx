import { auth } from "@/lib/auth";
import UserPageContent, {
  type OrganisationOwner,
  type OrganisationSummary,
} from "./UserPageContent";
import { AdminOrganisation } from "@ticketwaze/typescript-config";

export default async function OrganisationPage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const session = await auth();
  const { user: organisationId } = await params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/organisations/${organisationId}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session?.user.accessToken}` },
    },
  ).catch(() => null);
  const data = await response?.json().catch(() => null);
  const organisation: AdminOrganisation | null = data?.organisation ?? null;
  const summary: OrganisationSummary | null = data?.summary ?? null;
  const owner: OrganisationOwner | null = data?.owner ?? null;

  // Keyed by the record so a refresh after saving re-reads it from scratch.
  return (
    <UserPageContent
      key={organisation?.updatedAt ?? organisationId}
      organisation={organisation}
      summary={summary}
      owner={owner}
    />
  );
}
