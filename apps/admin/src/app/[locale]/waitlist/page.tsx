import { auth } from "@/lib/auth";
import AdminLayout from "@/components/Layouts/AdminLayout";
import WaitlistPageContent, { WaitlistEntry, WaitlistStats } from "./WaitlistPageContent";

export default async function WaitlistPage() {
  const session = await auth();

  let users: WaitlistEntry[] = [];
  let stats: WaitlistStats = {
    total: 0,
    invited: 0,
    pending: 0,
    attendee: 0,
    business: 0,
    both: 0,
    noAccount: 0,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const request = await fetch(
      // Pull the whole waitlist in one shot — the UI splits it into
      // All / Not invited / Invited / No account tabs and filters client-side,
      // so it needs every row rather than the backend's default first page
      // of 20. `hasAccount` is resolved per returned row, so asking for
      // everything is also what makes the No account tab complete.
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
    // The card keeps `overflow-y-auto` below `lg` for pages that scroll their
    // whole body. This page does not — it brings PAGE_SCROLLER — and two nested
    // scroll containers is what let the sticky heading be dragged out of view
    // on a phone: the inner one is what `sticky top-0` measures against, but
    // the outer one is what a touch drag moves. Turning the card's off leaves
    // exactly one scroller at every width.
    <AdminLayout className="overflow-y-hidden">
      <WaitlistPageContent
        users={users}
        stats={stats}
        accessToken={session?.user.accessToken ?? ""}
      />
    </AdminLayout>
  );
}
