import { redirect } from "@/i18n/navigation";
import NewPasswordPageWrapper from "./NewPasswordPageWrapper";
import { getLocale } from "next-intl/server";

export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const accessToken = (await searchParams).accessToken;
  const locale = await getLocale();
  if (!accessToken || accessToken.length === 0)
    return redirect({ href: "/auth/forgot-password", locale });
  return <NewPasswordPageWrapper accessToken={accessToken} />;
}
