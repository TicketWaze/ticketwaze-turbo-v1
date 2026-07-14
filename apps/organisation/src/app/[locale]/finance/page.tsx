import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import FinancePageContent from "./FinancePageContent";
import { auth } from "@/lib/auth";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import TopBar from "@/components/shared/TopBar";
import InitiateWithdrawalButton from "./InitiateWithdrawalButton";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";

export default async function FinancePage() {
  const t = await getTranslations("Finance");
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
      <OrganizerLayout title="Finance">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const authorized = request.status === 200;
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  const transactions = await request.json().catch(() => null);
  // On error/404 the API returns an error object without the transaction keys.
  // Guard the shape so the client render doesn't crash on undefined access.
  if (!request.ok || !transactions?.allOrders) {
    return (
      <OrganizerLayout title="Finance">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  return (
    <OrganizerLayout title="Finance">
      <TopBar title={t("title")}>
        {authorized && (
          <div className="hidden lg:block">
            <InitiateWithdrawalButton
              organisation={transactions.organisation}
            />
          </div>
        )}
      </TopBar>
      <FinancePageContent
        transactions={transactions}
        authorizedUpdate={authorized}
      />
    </OrganizerLayout>
  );
}
