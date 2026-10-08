import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import VerificationWrapper from "./VerificationWrapper";
import { withNext } from "@/lib/nextPath";

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();
  const { onboarding } = await searchParams;
  // Opened from the "verify your organisation" email while signed out, or
  // signed in with no organisation chosen yet: sign in / pick the
  // organisation first, then come straight back here.
  const here = onboarding === "1" ? "/auth/verification?onboarding=1" : "/auth/verification";
  if (!session?.user) {
    redirect({ href: withNext("/auth/login", here), locale });
  }
  if (!session?.activeOrganisation) {
    redirect({ href: withNext("/auth/onboarding", here), locale });
  }
  return <VerificationWrapper onboarding={onboarding === "1"} />;
}
