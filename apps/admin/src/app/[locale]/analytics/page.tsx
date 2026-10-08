import { Chart } from "iconsax-reactjs";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import AdminLayout from "@/components/Layouts/AdminLayout";
import UnauthorizedView from "@/components/shared/UnauthorizedView";
import AnalyticsPageContent, { type AnalyticsData } from "./AnalyticsPageContent";
import { readPeriod } from "./periods";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; eventId?: string }>;
}) {
  const session = await auth();
  const t = await getTranslations("Analytics");
  const permissions = (session?.user?.effectivePermissionKeys ?? []) as string[];

  // Figma "No access": the page heading stays, the content gives way to the note.
  if (!permissions.includes("analytics.view")) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-2">
          <h3 className="font-primary font-medium text-[2.6rem] leading-12 text-black">
            {t("title")}
          </h3>
          <p className="text-[1.5rem] leading-8 text-neutral-600">{t("description")}</p>
        </div>
        <UnauthorizedView icon={Chart} />
      </AdminLayout>
    );
  }

  const { period, eventId } = await searchParams;
  const query = new URLSearchParams({ period: readPeriod(period) });
  if (eventId) query.set("eventId", eventId);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/analytics?${query}`,
    {
      cache: "no-store",
      headers: { Authorization: `Bearer ${session?.user.accessToken}` },
    },
  ).catch(() => null);
  const data = (await response?.json().catch(() => null)) as
    | (AnalyticsData & { status: string })
    | null;

  return (
    <AdminLayout>
      <AnalyticsPageContent
        // A new filter means new data: remount so charts and bars animate in.
        key={`${data?.filters?.period}-${data?.filters?.eventId}`}
        data={data?.status === "success" ? data : null}
      />
    </AdminLayout>
  );
}
