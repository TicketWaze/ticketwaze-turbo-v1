import { auth } from "@/lib/auth";
import UserPageContent from "./UserPageContent";
import { AdminUser } from "@ticketwaze/typescript-config";

export default async function AttendeePage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const session = await auth();
  const { user: userId } = await params;

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/attendees/${userId}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );
  const response = await request.json();
  const user: AdminUser | null = response.user ?? null;
  const totalSpent: number = response.totalSpent ?? 0;

  return <UserPageContent user={user} totalSpent={totalSpent} />;
}
