import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { extractIdFromSlug } from "@/lib/Slugify";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { OrganisationPolicy } from "@/lib/role/organisationPolicy";
import { Sale } from "@ticketwaze/typescript-config";
import EditSaleForm from "./EditSaleForm";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const saleId = extractIdFromSlug(slug);
  const locale = await getLocale();
  const session = await auth();

  const authorized = OrganisationPolicy.fromSession(
    session?.activeOrganisation?.myPermissions ?? [],
  ).editSale();
  if (!authorized) {
    return <UnauthorizedView />;
  }

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
  // No `data` key at all on an error or a 404 — guard before reading through it.
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
      <EditSaleForm sale={sale} />
    </OrganizerLayout>
  );
}
