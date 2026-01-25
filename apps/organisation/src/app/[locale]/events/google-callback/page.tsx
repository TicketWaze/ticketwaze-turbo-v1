import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import PageLoader from "@/components/PageLoader";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const state = (await searchParams).state;
  const code = (await searchParams).code;
  const locale = await getLocale();
  if (!state || !code) {
    redirect({ href: "/events", locale });
  }
  const session = await auth();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/google/callback/response/${encodeURIComponent(code as string)}?state=${state}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();
  redirect({ href: response.authorizationUrl, locale });
  return (
    <OrganizerLayout title="">
      <PageLoader isLoading={true} />
    </OrganizerLayout>
  );
}
