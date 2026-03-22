import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import OnboardingOrganisationPageComponent from "./OnboardingOrganisationPageComponent";

export default async function OnboardingOrganisation() {
  const session = await auth();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  return <OnboardingOrganisationPageComponent />;
}
