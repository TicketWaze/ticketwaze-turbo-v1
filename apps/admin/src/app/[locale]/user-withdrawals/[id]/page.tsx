import AdminLayout from "@/components/Layouts/AdminLayout";
import UserWithdrawalRequestDetailWrapper from "./UserWithdrawalRequestDetailWrapper";
import { auth } from "@/lib/auth";

export default async function UserWithdrawalRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/user-withdrawals/request/${id}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const json = await res.json();
  return (
    <AdminLayout>
      <UserWithdrawalRequestDetailWrapper request={json.request} />
    </AdminLayout>
  );
}
