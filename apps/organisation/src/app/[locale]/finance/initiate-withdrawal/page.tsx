import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import InitiateWithdrawalPageWrapper from "./InitiateWithdrawalPageWrapper";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Organisation } from "@ticketwaze/typescript-config";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";

export default async function InitiateWithdrawalPage() {
  const locale = await getLocale();
  const session = await auth();
  const authorized = await organisationPolicy.CreateWithdrawalRequest(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );
  if (!authorized) return <UnauthorizedView />;
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
  const response = await request.json();
  const organisation: Organisation = response.organisation;
  return (
    <OrganizerLayout title="">
      <InitiateWithdrawalPageWrapper organisation={organisation} />
    </OrganizerLayout>
  );
}
