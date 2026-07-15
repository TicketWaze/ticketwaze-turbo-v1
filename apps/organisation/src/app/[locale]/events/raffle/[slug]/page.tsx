import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import BackButton from "@/components/shared/BackButton";
import { extractIdFromSlug } from "@/lib/Slugify";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { Raffle } from "@ticketwaze/typescript-config";
import RafflePageDetails from "./RafflePageDetails";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raffleId = extractIdFromSlug(slug);
  const t = await getTranslations("Raffles.single_raffle");
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

  return (
    <OrganizerLayout title="">
      <BackButton text={t("back")} />
      <RafflePageDetails
        raffle={raffle}
        entriesSold={response.entriesSold ?? 0}
        revenue={response.revenue ?? 0}
        participants={response.participants ?? []}
      />
    </OrganizerLayout>
  );
}
