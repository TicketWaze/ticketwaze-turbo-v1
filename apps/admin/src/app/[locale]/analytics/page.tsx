import { auth } from "@/lib/auth";
import AnalyticsPageContent, { AnalyticsData } from "./AnalyticsPageContent";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; activities?: string }>;
}) {
  const session = await auth();
  const { period = "this_month", activities = "all" } = await searchParams;

  const params = new URLSearchParams({ period, activities });
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/analytics?${params.toString()}`,
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

  const data: AnalyticsData = {
    stats: response.stats ?? {
      totalRevenue: 0,
      totalRevenueGrowth: 0,
      totalUsers: 0,
      totalUsersGrowth: 0,
      totalAttendees: 0,
      totalAttendeesGrowth: 0,
      totalOrganizers: 0,
      totalOrganizersGrowth: 0,
      totalEvents: 0,
      totalEventsGrowth: 0,
      totalTicketsSold: 0,
      totalTicketsSoldGrowth: 0,
      avgTicketsPerAttendee: 0,
      avgTicketsGrowth: 0,
      topOrganizerRevenue: 0,
      topOrganizerRevenueGrowth: 0,
    },
    revenueChart: response.revenueChart ?? [],
    userGrowthChart: response.userGrowthChart ?? [],
    genderDistribution: response.genderDistribution ?? {
      malePercent: 0,
      femalePercent: 0,
      othersPercent: 0,
    },
    topEvents: response.topEvents ?? [],
    topOrganizers: response.topOrganizers ?? [],
    paymentMethods: response.paymentMethods ?? [],
    activityStatus: response.activityStatus ?? { approved: 0, inReview: 0, rejected: 0 },
  };

  return <AnalyticsPageContent data={data} />;
}
