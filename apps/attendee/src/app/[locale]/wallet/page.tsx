import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import WalletPageContent from "./WalletPageContent";
import { Order, UserWallet } from "@ticketwaze/typescript-config";

export default async function Wallet() {
  const session = await auth();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  const OrderRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/me/orders`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const orderResponse = await OrderRequest.json();
  const orders: Order[] = orderResponse.orders;

  const walletRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/me/wallet`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const walletResponse = await walletRequest.json();
  const wallet: UserWallet = walletResponse.wallet;

  return (
    <AttendeeLayout title="Explore">
      <WalletPageContent orders={orders} wallet={wallet} />
    </AttendeeLayout>
  );
}
