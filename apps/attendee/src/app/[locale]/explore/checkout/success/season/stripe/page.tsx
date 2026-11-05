import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { getLocale } from "next-intl/server";
import PurchaseSuccess from "@/components/PurchaseSuccess";
import { FinishSeasonPassStripe } from "@/actions/seasonPassActions";

/** Stripe return for a signed-in pass buyer: records the passes, then the QR. */
export default async function SuccessSeasonPassStripe({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string | undefined }>;
}) {
  const { session_id } = await searchParams;
  const locale = await getLocale();
  const response = session_id
    ? await FinishSeasonPassStripe(session_id, locale, false)
    : null;

  if (
    !response ||
    (response.status !== "success" && response.status !== "duplicate") ||
    !response.season
  ) {
    redirect({ href: `/explore`, locale });
  }
  const passPath = `/upcoming/season/${slugify(response!.season!.name, response!.season!.seasonId)}?from=checkout`;

  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <PurchaseSuccess kind="ticket" redirectTo={passPath} />
    </AttendeeLayout>
  );
}
