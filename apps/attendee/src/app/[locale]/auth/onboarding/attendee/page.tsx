import { auth } from "@/lib/auth";
// The current onboarding, the same one /auth/onboarding renders. Login still
// sends organisation members here, and the old six-step flow that lived beside
// this page asked for keys that no longer exist in either locale.
import AttendeeOnboardingPageComponent from "../AttendeeOnboardingPageComponent";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function OnboardingAttendee() {
  const session = await auth();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  return <AttendeeOnboardingPageComponent />;
}
