import { getLocale } from "next-intl/server";
import ReserMailSentPageWrapper from "./ReserMailSentPageWrapper";
import { redirect } from "@/i18n/navigation";

export default async function ResetMailSentPage({
  params,
}: {
  params: Promise<{ email: string | undefined }>;
}) {
  const { email } = await params;
  const locale = await getLocale();
  if (!email || email.length === 0)
    return redirect({ href: "/auth/forgot-password", locale });
  return <ReserMailSentPageWrapper email={email} />;
}
