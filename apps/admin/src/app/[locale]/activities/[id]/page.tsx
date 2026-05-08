import AdminLayout from "@/components/Layouts/AdminLayout";
import ActivityPageComponent from "./components/ActivityPageComponent";
import { auth } from "@/lib/auth";

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();
  return (
    <AdminLayout>
      <ActivityPageComponent event={response.event} />
    </AdminLayout>
  );
}
