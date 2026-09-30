import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import FinancePageContent from "./FinancePageContent";
import {
  EMPTY_MONEY,
  FINANCE_PERIODS,
  type FinanceActivitiesPage,
  type FinancePeriod,
  type FinanceSummary,
} from "./types";

const emptyChannel = { gross: EMPTY_MONEY, net: EMPTY_MONEY };

const emptySummary: FinanceSummary = {
  period: "all",
  gross: EMPTY_MONEY,
  net: EMPTY_MONEY,
  collected: EMPTY_MONEY,
  channels: {
    moncash: emptyChannel,
    stripe: emptyChannel,
    natcash: emptyChannel,
    wallet: emptyChannel,
    other: emptyChannel,
  },
  breakdown: {
    activityFees: EMPTY_MONEY,
    subscriptions: EMPTY_MONEY,
    processing: EMPTY_MONEY,
    tokens: EMPTY_MONEY,
    giveaways: EMPTY_MONEY,
    refunds: EMPTY_MONEY,
  },
};

const PAGE_SIZE = 10;

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; page?: string; search?: string }>;
}) {
  const session = await auth();
  const { period: rawPeriod, page: rawPage, search } = await searchParams;
  const period: FinancePeriod = FINANCE_PERIODS.includes(
    rawPeriod as FinancePeriod,
  )
    ? (rawPeriod as FinancePeriod)
    : "all";
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.user.accessToken}`,
  };

  const listParams = new URLSearchParams({
    period,
    page: String(page),
    limit: String(PAGE_SIZE),
  });
  if (search) listParams.set("search", search);

  const [summaryRes, activitiesRes] = await Promise.all([
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/finance/summary?period=${period}`,
      { method: "GET", cache: "no-store", headers },
    ),
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/finance/activities?${listParams.toString()}`,
      { method: "GET", cache: "no-store", headers },
    ),
  ]);

  // The API omits its data keys on error, so guard before reading.
  const summaryJson = await summaryRes.json().catch(() => ({}));
  const activitiesJson = await activitiesRes.json().catch(() => ({}));

  const summary: FinanceSummary = summaryJson?.summary ?? emptySummary;
  const activities: FinanceActivitiesPage = activitiesJson?.activities ?? {
    meta: { total: 0, perPage: PAGE_SIZE, currentPage: 1, firstPage: 1, lastPage: 1 },
    data: [],
  };

  return (
    <AdminLayout>
      <FinancePageContent
        summary={summary}
        activities={activities}
        period={period}
        search={search ?? ""}
      />
    </AdminLayout>
  );
}
