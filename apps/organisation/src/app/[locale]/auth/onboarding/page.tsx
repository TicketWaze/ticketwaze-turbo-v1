import OnboardingLogic from "./OnboardingLogic";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";

export default async function OnboardingPage() {
  const session = await auth();
  const locale = await getLocale();
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
    const response = await request.json();
    // A failed request still parses as JSON, so the try/catch never fired and
    // OnboardingLogic received an error envelope in place of the onboarding
    // payload.
    if (!request.ok) {
      return <FetchFailedErrorView />;
    }
    return (
      <>
        <OnboardingLogic response={response} />
      </>
    );
  } catch {
    return <FetchFailedErrorView />;
  }
}
