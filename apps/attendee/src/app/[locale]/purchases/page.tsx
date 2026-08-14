import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import PurchasesContent, { Purchase } from "./PurchasesContent";

export default async function PurchasesPage() {
  const session = await auth();
  const t = await getTranslations("Sale");

  let purchases: Purchase[] = [];
  if (session?.user?.accessToken) {
    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/me/purchases`,
        {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        },
      );
      // The API omits its data key on error, so guard before reading.
      const response = await request.json().catch(() => null);
      purchases = response?.purchases ?? [];
    } catch {
      purchases = [];
    }
  }

  return (
    <AttendeeLayout title={t("purchasesTitle")}>
      <div className="flex flex-col gap-8 pb-16">
        <span className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-10 lg:leading-12 text-black">
          {t("purchasesTitle")}
        </span>
        <PurchasesContent purchases={purchases} />
      </div>
    </AttendeeLayout>
  );
}
