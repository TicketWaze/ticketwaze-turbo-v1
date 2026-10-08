import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import { getLocale } from "next-intl/server";
import PurchaseSuccess from "@/components/PurchaseSuccess";

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
    !response ||
    (response.status !== "success" && response.status !== "duplicate") ||
    !response.raffle
  ) {
    redirect({ href: `/explore`, locale });
  }
  // A signed-in buyer's entries live in their upcoming list, which is where
  // an event purchase lands too. The guest variant of this page keeps the
  // public URL — a guest has no account page to land on.
  const entriesPath = `/upcoming/raffle/${slugify(response.raffle.title, response.raffle.raffleId)}?from=checkout`;

  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <PurchaseSuccess kind="raffle" redirectTo={entriesPath} />
    </AttendeeLayout>
  );
}
