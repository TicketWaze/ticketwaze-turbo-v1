import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { auth } from "@/lib/auth";
import { OrganisationOrders } from "@ticketwaze/typescript-config";
import { getLocale, getTranslations } from "next-intl/server";
import OrganisationPageWrapper from "./OrganisationPageWrapper";
import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import BackButton from "@/components/shared/BackButton";

export default async function OrganisationTransactions({
  searchParams,
}: {
  searchParams: Promise<{ page: string | undefined }>;
}) {
  const t = await getTranslations("Finance");
  const locale = await getLocale();
  const session = await auth();
  const { page } = await searchParams;
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${session?.activeOrganisation.organisationId}/orders?limit=15&page=${page ?? 1}`,
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
  const response = await request.json();
  const organisationOrders: OrganisationOrders = await response.orders;
  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <OrganisationPageWrapper organisationOrders={organisationOrders} />
    </OrganizerLayout>
  );
}
