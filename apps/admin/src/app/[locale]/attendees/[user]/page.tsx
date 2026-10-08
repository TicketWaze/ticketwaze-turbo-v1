import { auth } from "@/lib/auth";
import UserPageContent, { type AttendeeSummary } from "./UserPageContent";
import { AdminUser } from "@ticketwaze/typescript-config";

export default async function AttendeePage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const session = await auth();
  const { user: userId } = await params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/attendees/${userId}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session?.user.accessToken}` },
    },
  ).catch(() => null);
  const data = await response?.json().catch(() => null);
  const user: AdminUser | null = data?.user ?? null;
  const summary: AttendeeSummary | null = data?.summary ?? null;

  // Keyed by the record so a refresh after saving re-reads it from scratch.
  return <UserPageContent key={user?.updatedAt ?? userId} user={user} summary={summary} />;
}
