import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import OrganizersContents from "./OrganizersContents";
import { auth } from "@/lib/auth";
import { Organisation } from "@ticketwaze/typescript-config";
import { getTranslations } from "next-intl/server";
import SignedOutState from "@/components/SignedOutState";

export default async function OrganizersPage() {
  const session = await auth();
  const title = (await getTranslations("Organizers"))("title");
  // Organisation pages are for account holders only.
  if (!session?.user) {
    return (
      <AttendeeLayout title={title}>
        <SignedOutState page="organisations" title={title} />
      </AttendeeLayout>
    );
  }
  const organisationRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations`,
  );
  // The API omits its data keys on error, so guard before reading.
  const organisationResponse = await organisationRequest
    .json()
    .catch(() => null);

  let followedOrganisations: Organisation[] = [];
  if (session.user.accessToken) {
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
    <AttendeeLayout title={title}>
      <OrganizersContents
        organisations={organisationResponse?.organisations ?? []}
        followedOrganisations={followedOrganisations}
      />
    </AttendeeLayout>
  );
}
