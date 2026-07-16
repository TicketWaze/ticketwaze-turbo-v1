import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { Raffle } from "@ticketwaze/typescript-config";
import { extractIdFromSlug } from "@/lib/Slugify";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import RaffleCheckout from "./RaffleCheckout";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raffleId = extractIdFromSlug(slug);
  const session = await auth();
  const t = await getTranslations("Raffle");

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/explore/raffles/${raffleId}`,
    { cache: "no-store" },
  ).catch(() => null);
  if (!request || !request.ok) notFound();
  const response = await request.json().catch(() => null);
  if (!response?.raffle) notFound();
  const raffle: Raffle = response.raffle;
  const remaining: number | null = response.remaining ?? null;

  // Same HTG/USD rate the backend charges with, so the displayed fee matches.
  let htgExchangeRate = 0;
  try {
    const currenciesRequest = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/currencies`,
      { cache: "no-store" },
    );
    const currenciesResponse = await currenciesRequest.json();
    const htg = currenciesResponse?.currencies?.find(
      (c: { isoCode: string }) => c.isoCode === "HTG",
    );
    htgExchangeRate = Number(htg?.exchangeRate) || 0;
  } catch {
    htgExchangeRate = 0;
  }

  let walletHtg = 0;
  let walletUsd = 0;
  let feeWaived = false;
  if (session?.user?.accessToken) {
    try {
      const walletRequest = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/wallet`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        },
      );
      const walletResponse = await walletRequest.json();
      walletHtg = Number(walletResponse?.wallet?.htgAvailableBalance) || 0;
      walletUsd = Number(walletResponse?.wallet?.usdAvailableBalance) || 0;
      feeWaived = walletResponse?.wallet?.firstPurchaseFeeWaiver === true;
    } catch {
      walletHtg = 0;
      walletUsd = 0;
      feeWaived = false;
    }
  }

  return (
    <AttendeeLayout title={t("checkout.title")}>
      <RaffleCheckout
        raffle={raffle}
        slug={slug}
        remaining={remaining}
        htgExchangeRate={htgExchangeRate}
        walletHtg={walletHtg}
        walletUsd={walletUsd}
        feeWaived={feeWaived}
        isLoggedIn={!!session?.user?.accessToken}
        accessToken={session?.user?.accessToken ?? ""}
      />
    </AttendeeLayout>
  );
}
