import { notFound, redirect } from "next/navigation";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import EditRestaurantForm from "./EditRestaurantForm";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const session = await auth();
  const { id, locale } = await params;

  const permissions = (session?.user.effectivePermissionKeys ?? []) as string[];
  if (!permissions.includes("activity.manage")) {
    redirect(`/${locale}/activities/restaurant/${id}`);
  }

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/restaurant/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
      cache: "no-store",
    },
  );
  const response = await request.json().catch(() => null);
  if (!response?.restaurant) notFound();

  return (
    <AdminLayout className="overflow-y-hidden">
      <EditRestaurantForm restaurant={response.restaurant} />
    </AdminLayout>
  );
}
