import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { PublicSale } from "@ticketwaze/typescript-config";
import { notFound } from "next/navigation";
import SaleCheckout from "./SaleCheckout";
import { extractIdFromSlug } from "@/lib/Slugify";

export default async function SaleCheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const saleId = extractIdFromSlug(slug);
  const session = await auth();

  // Not cached: the product can be taken down between browsing and paying, and
  // this is the last read before money moves.
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/explore/sales/${saleId}`,
    { cache: "no-store" },
  ).catch(() => null);
  if (!request || !request.ok) notFound();
  const response = await request.json().catch(() => null);
  if (!response?.sale) notFound();

  const sale: PublicSale = response.sale;

  // Only to warn about insufficient funds before the buyer picks the wallet.
  // The API re-checks the balance; nothing here decides whether a payment may
  // proceed.
  let walletUsd = 0;
  if (session?.user?.accessToken) {
    try {
      const walletRequest = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/me/wallet`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        },
      );
      const walletResponse = await walletRequest.json();
      walletUsd = Number(walletResponse?.wallet?.usdAvailableBalance ?? 0);
    } catch {
      walletUsd = 0;
    }
  }

  return (
    <AttendeeLayout title={sale.title}>
      <SaleCheckout sale={sale} walletUsd={walletUsd} />
    </AttendeeLayout>
  );
}
