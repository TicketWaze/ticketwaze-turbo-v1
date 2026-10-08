import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import VerificationWrapper from "./VerificationWrapper";

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.activeOrganisation) {
    redirect({ href: "/auth/onboarding", locale });
  }
  const { onboarding } = await searchParams;
  return <VerificationWrapper onboarding={onboarding === "1"} />;
}
