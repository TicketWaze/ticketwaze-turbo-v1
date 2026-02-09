import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import ExplorePageContent from "./ExplorePageContent";
import { auth } from "@/lib/auth";
import { Event, UserWallet } from "@ticketwaze/typescript-config";

export default async function Explore() {
  const request = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`);
  const response = await request.json();
  const events: Event[] = response.events;
  const session = await auth();
  const walletRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/users/me/wallet`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken ?? ""}`,
        "Content-Type": "application/json",
      },
    },
  );
  const walletResponse = await walletRequest.json();
  const wallet: UserWallet = walletResponse.wallet;
  return (
    <AttendeeLayout title="Explore">
      <ExplorePageContent events={events} wallet={wallet} />
    </AttendeeLayout>
  );
}
