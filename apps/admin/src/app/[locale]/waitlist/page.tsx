import { auth } from "@/lib/auth";
import AdminLayout from "@/components/Layouts/AdminLayout";
import WaitlistPageContent, { WaitlistEntry, WaitlistStats } from "./WaitlistPageContent";

export default async function WaitlistPage() {
  const session = await auth();

  let users: WaitlistEntry[] = [];
  let stats: WaitlistStats = { total: 0, invited: 0, pending: 0, attendee: 0, business: 0, both: 0 };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const request = await fetch(
      // Pull the whole waitlist in one shot — the UI splits it into
      // All / Invited tabs and filters client-side, so it needs every row
      // rather than the backend's default first page of 20.
      `${process.env.NEXT_PUBLIC_API_URL}/admin/waitlist?limit=100000&page=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        signal: controller.signal,
      },
    );
    clearTimeout(timeout);
    const response = await request.json();
    if (response.users?.data) users = response.users.data;
    if (response.stats) stats = response.stats;
  } catch {
    clearTimeout(timeout);
  }

  return (
    <AdminLayout>
      <WaitlistPageContent
        users={users}
        stats={stats}
        accessToken={session?.user.accessToken ?? ""}
      />
    </AdminLayout>
  );
}
