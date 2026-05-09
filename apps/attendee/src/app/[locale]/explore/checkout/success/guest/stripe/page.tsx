import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import PageLoader from "@/components/PageLoader";
import GuestSuccessContent from "./GuestSuccessContent";

export default async function GuestStripeSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string | undefined }>;
}) {
  const { session_id } = await searchParams;
  const locale = await getLocale();

  if (!session_id) {
    redirect({ href: "/explore", locale });
  }

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/guest/payments/stripe/success/${session_id}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const response = await request.json();

  if (response.status === "success" || response.status === "duplicate") {
    return (
      <AttendeeLayout title="Booking Confirmed">
        <GuestSuccessContent event={response.event} />
      </AttendeeLayout>
    );
  }

  redirect({ href: "/explore", locale });

  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <PageLoader isLoading={true} />
    </AttendeeLayout>
  );
}
