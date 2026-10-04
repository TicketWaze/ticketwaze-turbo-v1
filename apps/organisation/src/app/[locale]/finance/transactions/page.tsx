import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import BackButton from "@/components/shared/BackButton";
import { Order } from "@ticketwaze/typescript-config";
import { auth } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { TransactionsTable } from "../components/FinanceTables";

/**
 * Every transaction (Figma 1754:39485): the same table as the overview, 15 a
 * page, with the filter and search over all of them.
 */
export default async function TransactionsPage() {
  const t = await getTranslations("Finance");
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/transactions`,
    {
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  if (request.status === 403) return <UnauthorizedView />;
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.allOrders) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const orders: Order[] = response.allOrders.filter((o: Order) =>
    Boolean(o.activity),
  );
  return (
    <OrganizerLayout title="">
      <div className="flex flex-col gap-8 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <BackButton text={t("back")} />
        <TransactionsTable orders={orders} pageSize={15} titleAs="h1" />
      </div>
    </OrganizerLayout>
  );
}
