import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getLocale } from "next-intl/server";
import WalletPageContent from "./WalletPageContent";
import { UserOrdersRequest, UserWallet, UserWithdrawalRequest } from "@ticketwaze/typescript-config";

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

  const [orderResponse, walletResponse, withdrawalResponse] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/orders?limit=6`, { headers }).then((r) => r.json()),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/wallet`, { headers }).then((r) => r.json()),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/withdrawal`, { headers }).then((r) => r.json()),
  ]);

  const orders: UserOrdersRequest = orderResponse.orders;
  const wallet: UserWallet | undefined = walletResponse.wallet;
  const withdrawalRequests: UserWithdrawalRequest[] = withdrawalResponse.withdrawalRequests ?? [];

  if (!wallet) {
    return (
      <AttendeeLayout title="Explore">
        <div className="flex items-center justify-center h-full text-neutral-500 text-[1.6rem]">
          Unable to load wallet. Please try again later.
        </div>
      </AttendeeLayout>
    );
  }

  return (
    <AttendeeLayout title="Explore">
      <WalletPageContent
        ordersRequest={orders}
        wallet={wallet}
        withdrawalRequests={withdrawalRequests}
      />
    </AttendeeLayout>
  );
}
