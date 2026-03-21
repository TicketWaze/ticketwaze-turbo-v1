import { auth } from "@/lib/auth";
import InvitedOnboardingPageContent from "./InvitedOnboardingPageContent";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function InvitedOnboardingPage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  return <InvitedOnboardingPageContent />;
}
