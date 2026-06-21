import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import WalletPageContent from "./WalletPageContent";
import { UserOrdersRequest, UserWallet } from "@ticketwaze/typescript-config";
import { UserCashoutRequest } from "./types";

export default async function Wallet() {
  const session = await auth();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }

  const headers = {
    Authorization: `Bearer ${session?.user.accessToken}`,
    "Content-Type": "application/json",
  };

  const [orderResponse, walletResponse, cashoutResponse] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/orders?limit=6`, { headers }).then((r) => r.json()),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/wallet`, { headers }).then((r) => r.json()),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/cashout`, { headers }).then((r) => r.json()),
  ]);

  const orders: UserOrdersRequest = orderResponse.orders;
  const wallet: UserWallet = walletResponse.wallet;
  const cashoutRequests: UserCashoutRequest[] = cashoutResponse.cashoutRequests ?? [];

  return (
    <AttendeeLayout title="Explore">
      <WalletPageContent
        ordersRequest={orders}
        wallet={wallet}
        cashoutRequests={cashoutRequests}
      />
    </AttendeeLayout>
  );
}
