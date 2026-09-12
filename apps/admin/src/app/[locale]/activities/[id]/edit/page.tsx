import { notFound, redirect } from "next/navigation";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import EditActivityForm from "./EditActivityForm";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const session = await auth();
  const { id, locale } = await params;

  /**
   * Gated here as well as on the API, and neither is redundant: the API is what
   * actually enforces it, this is what stops an admin without the grant from
   * filling in a long form only to be refused on submit.
   */
  const permissions = (session?.user.effectivePermissionKeys ?? []) as string[];
  if (!permissions.includes("activity.manage")) {
    redirect(`/${locale}/activities/${id}`);
  }

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/event/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
      cache: "no-store",
    },
  );
  const response = await request.json();
  if (!response?.event) notFound();

  return (
    // The form is its own scroller, so the layout card must not be a second one
    // — see the note in components/shared/PageTitle.
    <AdminLayout className="overflow-y-hidden">
      <EditActivityForm event={response.event} />
    </AdminLayout>
  );
}
