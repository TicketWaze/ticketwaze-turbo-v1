import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import TopBar from "@/components/shared/TopBar";
import { auth } from "@/lib/auth";
import { OrganisationWithdrawalRequest } from "@ticketwaze/typescript-config";
import { getLocale, getTranslations } from "next-intl/server";
import WithdrawalRequestPageContent from "./WithdrawalRequestPageContent";

export default async function WithdrawalPage({
  searchParams,
}: {
  searchParams: Promise<{ page: string | undefined }>;
}) {
  const t = await getTranslations("Finance");
  const locale = await getLocale();
  const session = await auth();
  const { page } = await searchParams;
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/withdrawal?limit=15&page=${page ?? 1}`,
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
  if (!request.ok || !response?.withdrawalRequest) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const withdrawalRequest: OrganisationWithdrawalRequest =
    response.withdrawalRequest;
  return (
    <OrganizerLayout title="">
      <TopBar title={t("withdrawal.title")} />
      <WithdrawalRequestPageContent withdrawalRequest={withdrawalRequest} />
    </OrganizerLayout>
  );
}
