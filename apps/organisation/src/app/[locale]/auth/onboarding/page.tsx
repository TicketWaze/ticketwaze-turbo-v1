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
    const responseType: "invite" | "login" | "create" = response.type;
    const user = response.user;
    const organisations = response.organisations;
    return (
      <>
        <OnboardingLogic
          responseType={responseType}
          user={user}
          organisations={organisations}
        />
      </>
    );
  } catch (error) {
    return <FetchFailedErrorView />;
  }
}
