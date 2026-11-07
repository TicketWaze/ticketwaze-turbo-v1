import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { extractIdFromSlug } from "@/lib/Slugify";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Season } from "@ticketwaze/typescript-config";
import PassCheckout, { CheckoutPass } from "./PassCheckout";

/** Buying passes of one type: `/explore/season/[slug]/checkout?pass=<id>`. */
export default async function SeasonPassCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pass?: string }>;
}) {
  const [{ slug }, { pass: passTypeId }, session, t] = await Promise.all([
    params,
    searchParams,
    auth(),
    getTranslations("Season.checkout"),
  ]);

  // Uncached: the pass count left decides the quantity limit.
  const [seasonRequest, walletRequest] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/explore/seasons/${extractIdFromSlug(slug)}`,
      { cache: "no-store" },
    ).catch(() => null),
    session?.user?.accessToken
      ? fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/wallet`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        }).catch(() => null)
      : Promise.resolve(null),
  ]);
  if (!seasonRequest?.ok) notFound();
  const response = await seasonRequest.json().catch(() => null);
  const season: Season | undefined = response?.season;
  const pass: CheckoutPass | undefined = (response?.passTypes ?? []).find(
    (p: CheckoutPass) => p.seasonPassTypeId === passTypeId,
  );
  if (!season || !pass) notFound();

  let walletHtg = 0;
  let walletUsd = 0;
  try {
    const wallet = (await walletRequest?.json())?.wallet;
    walletHtg = Number(wallet?.htgAvailableBalance) || 0;
    walletUsd = Number(wallet?.usdAvailableBalance) || 0;
  } catch {
    walletHtg = 0;
    walletUsd = 0;
  }

  return (
    <AttendeeLayout title={t("title")}>
      <PassCheckout
        seasonName={season.name}
        slug={slug}
        pass={pass}
        walletHtg={walletHtg}
        walletUsd={walletUsd}
        isLoggedIn={!!session?.user?.accessToken}
      />
    </AttendeeLayout>
  );
}
