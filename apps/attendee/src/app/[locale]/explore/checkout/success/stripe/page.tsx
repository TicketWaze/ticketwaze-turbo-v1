import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { getLocale } from "next-intl/server";
import PurchaseSuccess from "@/components/PurchaseSuccess";

export default async function SuccessStripe({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string | undefined }>;
}) {
  const { session_id } = await searchParams;
  const session = await auth();
  const locale = await getLocale();

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/payments/stripe/success/${session_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();

  if (response.status !== "success" && response.status !== "duplicate") {
    redirect({ href: `/explore`, locale });
  }

  // Figma "Purchase successful", then on to the ticket in Upcoming.
  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <PurchaseSuccess
        redirectTo={`/upcoming/${slugify(response.event.eventName, response.event.eventId)}?from=checkout`}
      />
    </AttendeeLayout>
  );
}
