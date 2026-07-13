import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import InitiateWithdrawalPageWrapper from "./InitiateWithdrawalPageWrapper";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Organisation } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";

export default async function InitiateWithdrawalPage() {
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation.organisationId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.organisation) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const organisation: Organisation = response.organisation;
  return (
    <OrganizerLayout title="">
      <InitiateWithdrawalPageWrapper organisation={organisation} />
    </OrganizerLayout>
  );
}
