import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { extractIdFromSlug } from "@/lib/Slugify";
import { redirect } from "next/navigation";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { Raffle } from "@ticketwaze/typescript-config";
import EditRaffleForm from "./EditRaffleForm";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raffleId = extractIdFromSlug(slug);
  const locale = await getLocale();
  const session = await auth();

  let request: Response;
  try {
    request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/raffles/${session?.activeOrganisation.organisationId}/${raffleId}`,
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
  const response = await request.json().catch(() => null);
  if (!request.ok || !response?.raffle) {
    return (
      <OrganizerLayout title="">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  const raffle: Raffle = response.raffle;
  // Locked once drawn/closed or pending deletion — send back to the detail.
  if (raffle.status !== "on_sale" || raffle.deletionStatus) {
    redirect(`/events/raffle/${slug}`);
  }

  return (
    <OrganizerLayout title="">
      <EditRaffleForm raffle={raffle} />
    </OrganizerLayout>
  );
}
