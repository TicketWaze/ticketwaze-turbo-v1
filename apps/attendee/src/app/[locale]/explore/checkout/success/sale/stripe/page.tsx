import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import PageLoader from "@/components/PageLoader";

/**
 * Where Stripe returns a buyer after paying for a digital product.
 *
 * THIS PAGE IS WHAT COMPLETES THE PURCHASE. Stripe takes the money, but the
 * entitlement, the order line and the seller's credit are all created by the
 * finish call below — so a buyer who never reaches this URL has paid and
 * received nothing. It is the reason `return_url` in `StripeSalePurchase`
 * points here and nowhere else.
 *
 * The finish endpoint is idempotent on the Stripe session id, so a refresh, a
 * back-button, or Stripe returning twice all settle exactly once.
 */
export default async function SuccessSaleStripe({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string | undefined }>;
}) {
  const { session_id } = await searchParams;
  const session = await auth();
  const locale = await getLocale();

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/sales/stripe/finish/${session_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
      cache: "no-store",
    },
  ).catch(() => null);
  const response = request ? await request.json().catch(() => null) : null;

  if (response?.status === "success") {
    // Into the library, not back to the shop page: the buyer's next action is
    // downloading what they just bought.
    redirect({ href: `/purchases?from=checkout`, locale });
  } else {
    // The payment did not settle. Explore rather than the product page, which
    // would invite an immediate second attempt at something that just failed.
    redirect({ href: `/explore`, locale });
  }

  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <PageLoader isLoading={true} />
    </AttendeeLayout>
  );
}
