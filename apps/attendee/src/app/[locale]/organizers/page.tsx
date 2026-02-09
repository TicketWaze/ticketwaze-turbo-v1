import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import OrganizersContents from "./OrganizersContents";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Organisation } from "@ticketwaze/typescript-config";

export default async function OrganizersPage() {
  const session = await auth();
  const organisationRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations`,
  );
  const organisationResponse = await organisationRequest.json();

  const userRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/me/followed-organisations`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const userResponse = await userRequest.json();
  const followedOrganisations: Organisation[] =
    userResponse.followedOrganisations;

  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }

  return (
    <AttendeeLayout title="OrganizersPage">
      <OrganizersContents
        organisations={organisationResponse.organisations}
        followedOrganisations={followedOrganisations}
      />
    </AttendeeLayout>
  );
}
