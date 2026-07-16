import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import { Raffle } from "@ticketwaze/typescript-config";
import RaffleReviewComponent from "./components/RaffleReviewComponent";

export default async function RaffleReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/raffle/${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();
  const raffle: Raffle | undefined = response.raffle;

  if (!raffle) {
    return (
      <AdminLayout>
        <p className="text-[1.6rem] text-neutral-600 leading-10 p-8">
          Raffle not found.
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <RaffleReviewComponent
        raffle={raffle}
        organisation={response.organisation ?? null}
        entriesSold={response.entriesSold ?? 0}
      />
    </AdminLayout>
  );
}
