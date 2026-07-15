import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { getLocale } from "next-intl/server";
import PageLoader from "@/components/PageLoader";

export default async function SuccessRaffleStripe({
  searchParams,
}: {
  searchParams: Promise<{ session_id: string | undefined }>;
}) {
  const { session_id } = await searchParams;
  const session = await auth();
  const locale = await getLocale();

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/raffles/stripe/finish/${session_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  ).catch(() => null);
  const response = request ? await request.json().catch(() => null) : null;

  if (
    response &&
    (response.status === "success" || response.status === "duplicate") &&
    response.raffle
  ) {
    redirect({
      href: `/explore/raffle/${slugify(response.raffle.title, response.raffle.raffleId)}?from=checkout`,
      locale,
    });
  } else {
    redirect({ href: `/explore`, locale });
  }

  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <PageLoader isLoading={true} />
    </AttendeeLayout>
  );
}
