import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import OrganizersContents from "./OrganizersContents";
import { auth } from "@/lib/auth";
import { Organisation } from "@ticketwaze/typescript-config";

export default async function OrganizersPage() {
  const session = await auth();
  const organisationRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations`,
  );
  // The API omits its data keys on error, so guard before reading.
  const organisationResponse = await organisationRequest
    .json()
    .catch(() => null);

  /**
   * Only a signed-in user has follows. The request is skipped entirely for
   * guests rather than sent with an undefined token: it would be a guaranteed
   * 401, and the page has to render without it either way.
   */
  let followedOrganisations: Organisation[] = [];
  if (session?.user?.accessToken) {
    const userRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/followed-organisations`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    const userResponse = await userRequest.json().catch(() => null);
    followedOrganisations = userResponse?.followedOrganisations ?? [];
  }

  return (
    <AttendeeLayout title="OrganizersPage">
      <OrganizersContents
        organisations={organisationResponse?.organisations ?? []}
        followedOrganisations={followedOrganisations}
      />
    </AttendeeLayout>
  );
}
