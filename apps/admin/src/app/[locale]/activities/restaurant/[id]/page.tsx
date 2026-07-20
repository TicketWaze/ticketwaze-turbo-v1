import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import { Restaurant } from "@ticketwaze/typescript-config";
import RestaurantReviewComponent from "./components/RestaurantReviewComponent";

export default async function RestaurantReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
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
  // The API omits its data keys on error, so guard before reading.
  const response = await request.json().catch(() => null);
  const restaurant: Restaurant | undefined = response?.restaurant;

  if (!restaurant) {
    return (
      <AdminLayout>
        <p className="text-[1.6rem] text-neutral-600 leading-10 p-8">
          Venue not found.
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <RestaurantReviewComponent
        restaurant={restaurant}
        organisation={response.organisation ?? null}
      />
    </AdminLayout>
  );
}
