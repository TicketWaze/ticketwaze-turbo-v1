import { redirect } from "next/navigation";

/**
 * The dashboard home is Analytics. Redirected on the server: as a client page
 * this shipped and ran JavaScript only to navigate away, which on a slow
 * connection was seconds of blank screen before the real page even started.
 */
export default async function page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/analytics`);
}
