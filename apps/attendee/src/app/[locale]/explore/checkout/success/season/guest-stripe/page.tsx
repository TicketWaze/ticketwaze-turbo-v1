import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { getLocale } from "next-intl/server";
import PurchaseSuccess from "@/components/PurchaseSuccess";
import { FinishSeasonPassStripe } from "@/actions/seasonPassActions";

/**
 * Stripe return for a guest pass buyer. A guest has no account page, so the
 * public season page follows; the pass itself is in their email.
 */
export default async function SuccessSeasonPassGuestStripe({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string | undefined }>;
}) {
  const { session_id } = await searchParams;
  const locale = await getLocale();
  const response = session_id
    ? await FinishSeasonPassStripe(session_id, locale, true)
    : null;

  if (
    !response ||
    (response.status !== "success" && response.status !== "duplicate") ||
    !response.season
  ) {
    redirect({ href: `/explore`, locale });
  }
  const seasonPath = `/explore/season/${slugify(response!.season!.name, response!.season!.seasonId)}?from=checkout`;

  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <PurchaseSuccess kind="ticket" redirectTo={seasonPath} />
    </AttendeeLayout>
  );
}
