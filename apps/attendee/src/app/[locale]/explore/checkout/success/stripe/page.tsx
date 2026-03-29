import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { getLocale } from "next-intl/server";
import PageLoader from "@/components/PageLoader";

export default async function SuccessStripe({
  searchParams,
}: {
  searchParams: Promise<{ orderId: string | undefined }>;
}) {
  const { orderId } = await searchParams;
  const session = await auth();
  const locale = await getLocale();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/payments/stripe/success/${orderId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();
  if (response.status === "success") {
    redirect({
      href: `/upcoming/${slugify(response.event.eventName, response.event.eventId)}`,
      locale,
    });
  } else if (response.status === "duplicate") {
    redirect({
      href: `/upcoming/${slugify(response.event.eventName, response.event.eventId)}`,
      locale,
    });
  } else {
    redirect({
      href: `/explore/${slugify(response.event.eventName, response.event.eventId)}`,
      locale,
    });
  }
  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <PageLoader isLoading={true} />
    </AttendeeLayout>
  );
}
