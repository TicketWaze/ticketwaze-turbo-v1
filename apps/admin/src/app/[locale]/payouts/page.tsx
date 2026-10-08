import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import PayoutsPageContent, { type PayoutsOverview } from "./PayoutsPageContent";
import type { PayoutPage } from "./PayoutTable";

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  const { period } = await searchParams;
  const headers = { Authorization: `Bearer ${session?.user.accessToken}` };
  const api = process.env.NEXT_PUBLIC_API_URL;
  const get = (path: string) =>
    fetch(`${api}${path}`, { cache: "no-store", headers })
      .then((r) => r.json())
      .catch(() => null);

  // The tiles and the default view (organisations) of both tables; switching
  // a table to attendees, filtering or searching loads on the client.
  const [overview, requests, history] = await Promise.all([
    get(`/admin/payouts-overview${period ? `?period=${encodeURIComponent(period)}` : ""}`),
    get("/admin/payouts-list?kind=organisation&scope=requests&limit=5"),
    get("/admin/payouts-list?kind=organisation&scope=history&limit=5"),
  ]);

  return (
    <AdminLayout>
      <PayoutsPageContent
        overview={overview?.status === "success" ? (overview as PayoutsOverview) : null}
        requests={requests?.status === "success" ? (requests.payouts as PayoutPage) : null}
        history={history?.status === "success" ? (history.payouts as PayoutPage) : null}
      />
    </AdminLayout>
  );
}
