import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import { Sale } from "@ticketwaze/typescript-config";
import SaleReviewComponent from "./components/SaleReviewComponent";

export default async function SaleReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/sale/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
      cache: "no-store",
    },
  );
  // The API omits its data keys on error, so guard before reading.
  const response = await request.json().catch(() => null);
  const sale: Sale | undefined = response?.sale;

  if (!sale) {
    return (
      <AdminLayout>
        <p className="text-[1.6rem] text-neutral-600 leading-10 p-8">
          Product not found.
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SaleReviewComponent
        sale={sale}
        entitlementCount={Number(response?.entitlementCount ?? 0)}
      />
    </AdminLayout>
  );
}
