import { auth } from "@/lib/auth";
import KycReviewContent, { type KycReviewData } from "./KycReviewContent";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import AdminLayout from "@/components/Layouts/AdminLayout";

export default async function KycReviewPage({
  params,
}: {
  params: Promise<{ organisationId: string }>;
}) {
  const session = await auth();
  const { organisationId } = await params;
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/kyc/${organisationId}`,
    {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json().catch(() => null);
  if (!request.ok || response?.status !== "success") {
    return (
      <AdminLayout>
        <FetchFailedErrorView />
      </AdminLayout>
    );
  }
  return <KycReviewContent data={response as KycReviewData} />;
}
