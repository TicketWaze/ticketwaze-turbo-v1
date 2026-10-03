import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import SignedOutState from "@/components/SignedOutState";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import PendingPurchasesContent, {
  PendingPurchase,
} from "./PendingPurchasesContent";

// Figma "Pending Purchases": checkouts the buyer started and didn't finish.
export default async function PendingPurchasesPage() {
  const t = await getTranslations("Explore.pending");
  const session = await auth();
  if (!session?.user) {
    return (
      <AttendeeLayout title={t("title")}>
        <SignedOutState page="pending" title={t("title")} />
      </AttendeeLayout>
    );
  }
  let purchases: PendingPurchase[] = [];
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me/pending-purchases`,
      {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
        cache: "no-store",
      },
    );
    const response = await request.json();
    purchases = Array.isArray(response?.pendingPurchases)
      ? response.pendingPurchases
      : [];
  } catch (error) {
    console.error("Failed to load pending purchases:", error);
  }
  return (
    <AttendeeLayout title={t("title")}>
      <PendingPurchasesContent purchases={purchases} />
    </AttendeeLayout>
  );
}
