import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import BackButton from "@/components/shared/BackButton";
import { extractIdFromSlug } from "@/lib/Slugify";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { Sale } from "@ticketwaze/typescript-config";
import SalePageDetails from "./SalePageDetails";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const saleId = extractIdFromSlug(slug);
  const t = await getTranslations("Sales.single_sale");
  const locale = await getLocale();
  const session = await auth();

  let request: Response;
  try {
    request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/sales/${session?.activeOrganisation.organisationId}/${saleId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
        cache: "no-store",
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
  // The API omits `data` entirely on an error or a 404, so this cannot assume
  // the key is there — reading through it would crash the page rather than show
  // the error view.
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.data) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const sale: Sale = response.data;

  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <SalePageDetails sale={sale} />
    </OrganizerLayout>
  );
}
