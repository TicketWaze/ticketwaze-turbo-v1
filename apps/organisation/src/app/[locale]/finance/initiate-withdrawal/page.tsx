import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import InitiateWithdrawalPageWrapper from "./InitiateWithdrawalPageWrapper";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Order, Organisation } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";

/**
 * Initiate Withdrawal. Reads the same payload as the Finance page so the
 * summary's revenue / fees / profit match the tiles exactly.
 */
export default async function InitiateWithdrawalPage() {
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
  if (!request.ok || !response?.organisation) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const organisation: Organisation = response.organisation;
  const orders: Order[] = (response.allOrders ?? []).filter((o: Order) =>
    Boolean(o.activity),
  );
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <InitiateWithdrawalPageWrapper
        organisation={organisation}
        orders={orders}
      />
    </OrganizerLayout>
  );
}
