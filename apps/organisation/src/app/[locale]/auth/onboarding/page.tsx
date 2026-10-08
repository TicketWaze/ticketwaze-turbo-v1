import OnboardingLogic from "./OnboardingLogic";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { safeNextPath, withNext } from "@/lib/nextPath";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();
  const next = safeNextPath((await searchParams).next);
  // Onboarding is an /auth page, so the proxy lets a signed-out visitor
  // through. Without a session the request below can only fail; send them to
  // sign in instead, keeping where they were headed.
  if (!session?.user?.accessToken) {
    redirect({ href: withNext("/auth/login", next), locale });
  }
  let status = 0;
  let response: unknown = null;
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/onboarding`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    status = request.status;
    response = await request.json();
  } catch {
    return <FetchFailedErrorView />;
  }
  // An expired session: sign in again rather than show a network error.
  // Outside the try because `redirect` works by throwing.
  if (status === 401) {
    redirect({ href: withNext("/auth/login", next), locale });
  }
  // A failed request still parses as JSON, so it is checked by status rather
  // than left for OnboardingLogic to receive an error envelope.
  if (status < 200 || status >= 300) {
    return <FetchFailedErrorView />;
  }
  return <OnboardingLogic response={response} next={next} />;
}
