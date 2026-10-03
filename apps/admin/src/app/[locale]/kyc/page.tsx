import { auth } from "@/lib/auth";
import KycPageContent, { type KycQueueRow } from "./KycPageContent";

export default async function KycPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const session = await auth();
  const { status = "pending", page } = await searchParams;
  const params = new URLSearchParams({ status });
  if (page) params.set("page", page);

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/kyc?${params.toString()}`,
    {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json().catch(() => null);

  return (
    <KycPageContent
      rows={(response?.data ?? []) as KycQueueRow[]}
      meta={response?.meta ?? { currentPage: 1, lastPage: 1, total: 0 }}
      pendingCount={response?.pendingCount ?? 0}
      status={status}
    />
  );
}
