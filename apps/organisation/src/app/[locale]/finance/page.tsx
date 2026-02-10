import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import FinancePageContent from "./FinancePageContent";
import { auth } from "@/lib/auth";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import TopBar from "@/components/shared/TopBar";
import InitiateWithdrawalButton from "./InitiateWithdrawalButton";

export default async function FinancePage() {
  const t = await getTranslations("Finance");
  const locale = await getLocale();
  const session = await auth();
  const authorized = await organisationPolicy.viewFinance(
    session?.user.userId ?? "",
    session?.activeOrganisation.organisationId ?? "",
  );
  if (!authorized) {
    return <UnauthorizedView />;
  }
  const request = await fetch(
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
  const transactions = await request.json();
  return (
    <OrganizerLayout title="Finance">
      <TopBar title={t("title")}>
        <div className="hidden lg:block">
          <InitiateWithdrawalButton organisation={transactions.organisation} />
        </div>
      </TopBar>
      <FinancePageContent transactions={transactions} />
    </OrganizerLayout>
  );
}
