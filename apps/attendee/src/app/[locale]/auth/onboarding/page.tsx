import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import AttendeeOnboardingPageComponent from "./AttendeeOnboardingPageComponent";

export default async function Onboarding() {
  const session = await auth();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  return <AttendeeOnboardingPageComponent />;
}
