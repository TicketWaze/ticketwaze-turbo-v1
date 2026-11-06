import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import SeasonReviewComponent, {
  type AdminSeasonDetail,
} from "./components/SeasonReviewComponent";

/** Admin › Activities › a season: review, suspension, matches, passes, printing. */
export default async function SeasonReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/season/${id}`,
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
  const response = (await request.json().catch(() => null)) as
    | (AdminSeasonDetail & { status: string })
    | null;

  if (!response?.season) {
    return (
      <AdminLayout>
        <p className="text-[1.6rem] text-neutral-600 leading-10 p-8">
          Season not found.
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <SeasonReviewComponent detail={response} />
    </AdminLayout>
  );
}
