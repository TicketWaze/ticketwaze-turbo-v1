import { auth } from "@/lib/auth";
import UserPageContent from "./UserPageContent";
import { AdminOrganisation } from "@ticketwaze/typescript-config";

export default async function OrganisationsPage({
  params,
}: {
  params: Promise<{ user: string }>;
}) {
  const session = await auth();
  const { user: organisationId } = await params;

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/organisations/${organisationId}`,
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

  const organisation: AdminOrganisation | null = response.organisation ?? null;
  const totalRevenue: number = response.totalRevenue ?? 0;
  const totalTicketsSold: number = response.totalTicketsSold ?? 0;

  return (
    <UserPageContent
      organisation={organisation}
      totalRevenue={totalRevenue}
      totalTicketsSold={totalTicketsSold}
    />
  );
}
