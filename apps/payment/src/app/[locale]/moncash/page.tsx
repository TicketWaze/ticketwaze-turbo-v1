import PageLoader from "@/components/PageLoader";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function MoncashGateway({
  searchParams,
}: {
  searchParams: Promise<{ transactionId: string | undefined }>;
}) {
  const { transactionId } = await searchParams;
  const locale = await getLocale();
  if (!transactionId || transactionId.trim().length === 0) {
    redirect({
      href: `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/explore`,
      locale: locale,
    });
  }
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/payments/moncash/success/${transactionId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const response = await request.json();
  console.log(response);
  if (response.status === "failed") {
    redirect({
      href: `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/explore`,
      locale: locale,
    });
  } else {
    redirect({
      href: response.redirectUrl,
      locale: locale,
    });
  }
  return <PageLoader isLoading={true} />;
}
