import AdminLayout from "@/components/Layouts/AdminLayout";
import PayoutRequestPageWrapper from "./PayoutRequestPageWrapper";
import { auth } from "@/lib/auth";

export default async function PayoutRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/payouts/request/${id}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();
  return (
    <AdminLayout>
      <PayoutRequestPageWrapper
        request={response.request}
        organisationTier={response.organisationTier}
        organisationActiveSubscription={response.organisationActiveSubscription}
      />
    </AdminLayout>
  );
}
