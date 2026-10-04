import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale } from "next-intl/server";
import FinancePageContent from "./FinancePageContent";
import { auth } from "@/lib/auth";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";

export default async function FinancePage() {
  const locale = await getLocale();
  const session = await auth();

  let request: Response;
  try {
    request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/transactions`,
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
  } catch {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  const transactions = await request.json().catch(() => null);
  // On error the API returns an object without the transaction keys; guard the
  // shape so the client render doesn't crash on undefined access.
  if (!request.ok || !transactions?.allOrders) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  // Seeing the money (viewFinance) is not the same as moving it.
  const canWithdraw = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).CreateWithdrawalRequest();

  return (
    <OrganizerLayout title="">
      <FinancePageContent
        transactions={transactions}
        canWithdraw={canWithdraw}
      />
    </OrganizerLayout>
  );
}
