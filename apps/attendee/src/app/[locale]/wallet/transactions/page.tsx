import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { UserOrdersRequest } from "@ticketwaze/typescript-config";
import { getLocale } from "next-intl/server";
import TransactionsPageContent from "./TransactionsPageContent";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";

export default async function WalletTransationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page: string | undefined }>;
}) {
  const session = await auth();
  const locale = await getLocale();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  const { page } = await searchParams;
  const OrderRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/me/orders?limit=10&page=${page ?? 1}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const orderResponse = await OrderRequest.json();
  const ordersRequest: UserOrdersRequest = orderResponse.orders;
  return (
    <AttendeeLayout title="User transactions">
      <TransactionsPageContent ordersRequest={ordersRequest} />
    </AttendeeLayout>
  );
}
