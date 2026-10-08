import { Suspense } from "react";
import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Organisation } from "@ticketwaze/typescript-config";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import PaymentContent from "./PaymentContent";

export default async function PaymentPage() {
  const locale = await getLocale();
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/me/${session?.activeOrganisation.organisationId}`,
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
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-y-auto"
    >
      <Suspense>
        <PaymentContent organisation={response.organisation as Organisation} />
      </Suspense>
    </OrganizerLayout>
  );
}
