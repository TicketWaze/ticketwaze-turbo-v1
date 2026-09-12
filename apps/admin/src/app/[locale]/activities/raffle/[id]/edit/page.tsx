import { notFound, redirect } from "next/navigation";
import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import EditRaffleForm from "./EditRaffleForm";

export default async function EditRafflePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const session = await auth();
  const { id, locale } = await params;

  const permissions = (session?.user.effectivePermissionKeys ?? []) as string[];
  if (!permissions.includes("activity.manage")) {
    redirect(`/${locale}/activities/raffle/${id}`);
  }

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/raffle/${id}`,
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
  if (!response?.raffle) notFound();

  /**
   * A drawn raffle is closed to editing for everybody — the draw already used
   * the prize list and the entry set, so rewriting them would make the
   * published record disagree with the result people were given. The API
   * refuses it too; this just avoids showing a form that cannot be saved.
   */
  if (response.raffle.drawnAt) {
    redirect(`/${locale}/activities/raffle/${id}`);
  }

  return (
    <AdminLayout className="overflow-y-hidden">
      <EditRaffleForm
        raffle={response.raffle}
        entriesSold={response.entriesSold ?? 0}
      />
    </AdminLayout>
  );
}
