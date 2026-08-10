import { auth } from "@/lib/auth";
import AdminLayout from "@/components/Layouts/AdminLayout";
import {
  EventRevision,
  RaffleRevision,
} from "@ticketwaze/typescript-config";
import RevisionsPageContent from "./RevisionsPageContent";

async function fetchRevisions<T>(
  path: string,
  accessToken: string | undefined,
): Promise<{ revisions?: T[] }> {
  const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  // The API omits the data key on error, so this cannot be destructured blind.
  if (!request.ok) return {};
  return request.json();
}

export default async function RevisionsPage() {
  const session = await auth();
  const accessToken = session?.user.accessToken;

  const [events, raffles] = await Promise.all([
    fetchRevisions<EventRevision>("/admin/event-revisions", accessToken),
    fetchRevisions<RaffleRevision>("/admin/raffle-revisions", accessToken),
  ]);

  return (
    <AdminLayout>
      <RevisionsPageContent
        revisions={events.revisions ?? []}
        raffleRevisions={raffles.revisions ?? []}
      />
    </AdminLayout>
  );
}
