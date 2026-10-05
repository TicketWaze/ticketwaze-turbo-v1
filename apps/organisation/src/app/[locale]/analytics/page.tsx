import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { auth } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { redirect } from "next/navigation";
import { Crown, InfoCircle } from "iconsax-reactjs";
import ProFeatureAlert from "@/components/Layouts/ProFeatureAlert";
import { LinkPrimary } from "@/components/shared/Links";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import { cn } from "@/lib/utils";
import {
  DonutChart,
  RevenueTicketsChart,
  SalesLineChart,
  TicketClassesChart,
} from "./charts";
import StarRatingChart from "./StarRatingChart";
import AnalyticsFilters from "./AnalyticsFilters";
import { PERIODS, type Period } from "./periods";
import { Reveal } from "@/components/shared/motion";
import {
  BarList,
  Metric,
  PanelTitle,
  SectionTitle,
  TrendBadge,
  Unit,
} from "./parts";

function UpgradeButton({ label }: { label: string }) {
  return (
    <div className="w-fit p-[.2rem] rounded-[30px] bg-linear-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
      <LinkPrimary
        className="bg-transparent gap-4 py-2 items-center"
        href="/settings/subscriptions/upgrade"
      >
        <Crown size="24" color="#fff" variant="Bulk" />
        <span>{label}</span>
      </LinkPrimary>
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; period?: string }>;
}) {
  const session = await auth();
  const currentOrganisationId = session?.activeOrganisation?.organisationId;
  if (!session?.user) {
    redirect(`/auth/login`);
  }
  if (!session?.activeOrganisation?.organisationId) {
    redirect(`/auth/logout`);
  }

  const t = await getTranslations("Analytics");
  const locale = await getLocale();

  const params = await searchParams;
  const period: Period = PERIODS.includes(params.period as Period)
    ? (params.period as Period)
    : "month";
  const query = new URLSearchParams({ period });
  if (params.eventId) query.set("eventId", params.eventId);

  let request: Response;
  try {
    request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${currentOrganisationId}/analytics?${query}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
          Authorization: `Bearer ${session.user.accessToken}`,
        },
      },
    );
  } catch {
    return (
      <OrganizerLayout title="Analytics">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }
  if (request.status === 403) {
    return <UnauthorizedView />;
  }
  // A stale link to an activity that is gone (or belongs to another
  // organisation) falls back to every activity rather than an error page.
  if (request.status === 404 && params.eventId) {
    redirect(period === "month" ? "/analytics" : `/analytics?period=${period}`);
  }
  const analytics = await request.json().catch(() => null);
  // On error the API returns an error object without the analytics keys.
  // Guard the shape so the server render doesn't crash on undefined access.
  if (!request.ok || !analytics?.membershipTier) {
    return (
      <OrganizerLayout title="Analytics">
        <FetchFailedErrorView />
      </OrganizerLayout>
    );
  }

  const isFree = analytics.membershipTier?.membershipName === "free";
  const eventId: string | null = analytics.filters?.eventId ?? null;

  const num = (value: number, digits = 0) =>
    Number(value ?? 0).toLocaleString(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  // Figma's empty state reads "0 HTG", not "0.00 HTG".
  const money = (value: number) => (Number(value) ? num(value, 2) : "0");
  const trendLabel = (value: number | null | undefined) =>
    value === null || value === undefined
      ? ""
      : t(value < 0 ? "trend.down" : "trend.up", { value: Math.abs(value) });

  /* ── Demographics ── */
  const gender = analytics.genderPercentages ?? {};
  const hasSales = analytics.totalTicketsSold > 0;
  const genderRows = [
    { key: "male", value: gender.male ?? 0 },
    { key: "female", value: gender.female ?? 0 },
    { key: "others", value: (gender.other ?? 0) + (gender.others ?? 0) },
  ].map(({ key, value }) => ({
    label: t(`event.event_demographics.gender_distribution.gender.${key}`),
    value,
    display: hasSales ? `${Math.round(value)}%` : "0",
  }));

  const topEvents = (
    (analytics.topEvents ?? []) as Array<{
      eventName: string;
      percentage: string;
    }>
  ).slice(0, 3);
  const topEventRows =
    topEvents.length > 0
      ? topEvents.map((e) => ({
          label: e.eventName,
          value: parseFloat(e.percentage) || 0,
          display: e.percentage,
        }))
      : Array.from({ length: 3 }, () => ({
          label: "–",
          value: 0,
          display: "0",
        }));

  /* ── More insights ── */
  const guestVsRegisteredItems = [
    {
      label: t("audience.guest"),
      value: analytics.guestVsRegistered?.guest?.count ?? 0,
      color: "#FFCFAB",
    },
    {
      label: t("audience.registered"),
      value: analytics.guestVsRegistered?.registered?.count ?? 0,
      color: "#E45B00",
    },
  ];

  const providerColorMap: Record<string, string> = {
    stripe: "#635BFF",
    moncash: "#E52222",
  };
  const paymentProviderItems =
    (
      analytics.paymentProviders as Array<{
        provider: string;
        count: number;
      }>
    )?.map((p, i) => ({
      label: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
      value: p.count,
      color:
        providerColorMap[p.provider.toLowerCase()] ??
        `hsl(${(i * 67) % 360}, 65%, 55%)`,
    })) ?? [];

  const topEventsByViewsArr =
    (analytics.topEventsByViews as Array<{
      eventName: string;
      viewCount: number;
    }>) ?? [];
  const totalViews = topEventsByViewsArr.reduce((s, e) => s + e.viewCount, 0);
  const topEventsByViewsRows = topEventsByViewsArr.slice(0, 5).map((e) => {
    const share = totalViews > 0 ? (e.viewCount / totalViews) * 100 : 0;
    return {
      label: e.eventName,
      value: share,
      display: `${Math.round(share)}%`,
    };
  });

  // 2×2 on mobile (dividers between columns and rows), one row of four on desktop.
  const kpiTiles = [
    "max-lg:pr-6 max-lg:pb-8 max-lg:border-r lg:pr-[2.5rem] lg:pb-10",
    "max-lg:pl-6 max-lg:pb-8 lg:px-[2.5rem] lg:pb-10",
    "max-lg:pr-6 max-lg:pt-8 max-lg:border-r max-lg:border-t lg:px-[2.5rem] lg:pb-10",
    "max-lg:pl-6 max-lg:pt-8 max-lg:border-t lg:pl-[2.5rem] lg:pb-10",
  ].map((c) => cn(c, "border-neutral-100"));

  return (
    <OrganizerLayout title="Analytics">
      <div className="flex flex-col gap-16 overflow-y-auto pb-16">
        {/* Header */}
        <Reveal
          y={-12}
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex flex-col gap-2">
            <h1 className="font-primary font-medium text-[2.6rem] leading-12 text-black">
              {t("title")}
            </h1>
            <p className="font-sans text-[1.6rem] leading-[2.25rem] text-neutral-600">
              {t("description")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {isFree && <UpgradeButton label={t("upgrade")} />}
            <AnalyticsFilters
              events={analytics.events ?? []}
              eventId={eventId}
              period={period}
            />
          </div>
        </Reveal>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 lg:border-b border-neutral-100 divide-neutral-100 lg:divide-x">
          <Reveal className={kpiTiles[0]} delay={0.08}>
            <Metric
              label={t("revenue")}
              size="responsive"
              trend={
                <span className="hidden lg:inline-flex">
                  <TrendBadge
                    value={analytics.trends?.revenue}
                    label={trendLabel(analytics.trends?.revenue)}
                  />
                </span>
              }
            >
              {money(analytics.totalRevenueHtg)} <Unit>HTG</Unit>
              <span className="block font-sans font-normal text-[1.2rem] leading-6 text-neutral-500">
                {money(analytics.totalRevenue)} USD
              </span>
            </Metric>
          </Reveal>
          <Reveal className={kpiTiles[1]} delay={0.13}>
            <Metric
              label={t("sold")}
              size="responsive"
              trend={
                <span className="hidden lg:inline-flex">
                  <TrendBadge
                    value={analytics.trends?.ticketsSold}
                    label={trendLabel(analytics.trends?.ticketsSold)}
                  />
                </span>
              }
            >
              {num(analytics.totalTicketsSold)}
            </Metric>
          </Reveal>
          <Reveal className={kpiTiles[2]} delay={0.18}>
            <Metric label={t("content.upcomingTitle")} size="responsive">
              {num(analytics.upcomingEvents)}
            </Metric>
          </Reveal>
          <Reveal className={kpiTiles[3]} delay={0.23}>
            <Metric
              label={t("content.view")}
              size="responsive"
              trend={
                <span className="hidden lg:inline-flex">
                  <TrendBadge
                    value={analytics.trends?.eventViews}
                    label={trendLabel(analytics.trends?.eventViews)}
                  />
                </span>
              }
            >
              {num(analytics.eventViews)}
            </Metric>
          </Reveal>
        </div>

        {/* Ticket Sales Insights */}
        <Reveal as="section" delay={0.25} className="flex flex-col gap-10">
          <SectionTitle>{t("tickets.title")}</SectionTitle>
          <div className="grid grid-cols-1 gap-12 lg:gap-0 lg:grid-cols-2 lg:divide-x divide-neutral-100 lg:border-b border-neutral-100">
            <div className="flex flex-col gap-10 min-w-0 lg:pr-[3rem] lg:pt-6 lg:pb-10">
              <PanelTitle>
                {t(
                  analytics.salesSeries?.granularity === "month"
                    ? "tickets.monthly"
                    : "tickets.daily",
                )}
              </PanelTitle>
              <SalesLineChart
                key={`${eventId ?? "all"}:${period}`}
                series={analytics.salesSeries}
              />
            </div>
            <div className="min-w-0 lg:pl-[3rem] lg:pt-6 lg:pb-10">
              <TicketClassesChart
                ticketTypePercentages={analytics.ticketTypePercentages}
              />
            </div>
          </div>
        </Reveal>

        {/* Demographics */}
        <Reveal as="section" delay={0.32} className="flex flex-col gap-10">
          <SectionTitle>{t("event.event_demographics.title")}</SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100 lg:border-b border-neutral-100">
            <div className="flex flex-col gap-8 pb-8 lg:pr-[2.5rem] lg:pb-10 min-w-0">
              <PanelTitle>
                {t("event.event_demographics.gender_distribution.title")}
              </PanelTitle>
              {isFree ? <ProFeatureAlert /> : <BarList rows={genderRows} />}
            </div>
            <div className="flex flex-col gap-8 pt-8 lg:pt-0 lg:pl-[2.5rem] lg:pb-10 min-w-0">
              <PanelTitle>
                {t("event.event_demographics.events_top.title")}
              </PanelTitle>
              <BarList rows={topEventRows} truncateLabels />
            </div>
          </div>
        </Reveal>

        {isFree ? (
          <div className="flex items-center flex-col gap-8">
            <div className="flex items-center flex-col gap-4">
              <InfoCircle size="32" color="#D5D8DC" />
              <span className="font-primary text-[1.4rem] text-neutral-500 text-center">
                {t("upgradeAlert")}
              </span>
            </div>
            <UpgradeButton label={t("upgrade")} />
          </div>
        ) : (
          <>
            {/* Engagement & Feedback */}
            <Reveal as="section" delay={0.39} className="flex flex-col gap-10">
              <SectionTitle>{t("feedback.title")}</SectionTitle>
              <div className="flex flex-col gap-8 lg:flex-row lg:justify-between lg:gap-12">
                <Metric label={t("feedback.action.click_on_event")}>
                  {num(analytics.eventViews)}
                </Metric>
                <Metric label={t("feedback.action.social_media_shares")}>
                  {num(analytics.socialShares)}
                </Metric>
                <Metric label={t("feedback.action.add_favorite")}>
                  {num(analytics.favorites)}
                </Metric>
                <Metric label={t("feedback.action.rated")}>
                  {analytics.average} <Unit>/ 5</Unit>
                </Metric>
                <Metric label={t("feedback.action.reviews")}>
                  {num(analytics.totalReviews)}
                </Metric>
              </div>
            </Reveal>

            {/* More insights — post-design metrics, in the same visual language */}
            <Reveal
              as="section"
              delay={0.46}
              className="flex flex-col gap-10 border-t border-neutral-100 pt-16"
            >
              <SectionTitle>{t("more.title")}</SectionTitle>
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-12">
                <Metric label={t("kpi.orders")} size="responsive">
                  {num(analytics.totalOrders)}
                </Metric>
                <Metric label={t("kpi.avgOrderValue")} size="responsive">
                  {money(analytics.averageOrderValue)} <Unit>USD</Unit>
                </Metric>
                <Metric label={t("kpi.totalEvents")} size="responsive">
                  {num(analytics.totalEvents)}
                </Metric>
                <Metric label={t("kpi.pastEvents")} size="responsive">
                  {num(analytics.pastEvents)}
                </Metric>
                <Metric label={t("content.followers")} size="responsive">
                  {num(analytics.followers)}
                </Metric>
                <Metric label={t("engagement.conversion")} size="responsive">
                  {analytics.conversionRate}
                  <Unit>%</Unit>
                </Metric>
                <Metric label={t("engagement.checkIn")} size="responsive">
                  {analytics.checkInRate}
                  <Unit>%</Unit>
                </Metric>
                <Metric label={t("engagement.refund")} size="responsive">
                  {analytics.refundRate}
                  <Unit>%</Unit>
                </Metric>
              </div>
            </Reveal>

            <Reveal as="section" delay={0.53} className="flex flex-col gap-10">
              <PanelTitle>{t("chart.monthly")}</PanelTitle>
              <RevenueTicketsChart
                revenueByMonth={analytics.revenueByMonth}
                ticketsByMonth={analytics.ticketsByMonth}
              />
            </Reveal>

            <Reveal
              as="section"
              delay={0.55}
              className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100 border-y border-neutral-100"
            >
              <div className="py-10 lg:pr-[2.5rem]">
                <DonutChart
                  title={t("audience.guestVsRegistered")}
                  items={guestVsRegisteredItems}
                />
              </div>
              <div className="py-10 lg:pl-[2.5rem]">
                <DonutChart
                  title={t("audience.paymentProviders")}
                  items={paymentProviderItems}
                />
              </div>
            </Reveal>

            <Reveal
              as="section"
              delay={0.55}
              className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100"
            >
              <div className="flex flex-col gap-8 pb-10 lg:pr-[2.5rem] min-w-0">
                <PanelTitle>{t("more.topByViews")}</PanelTitle>
                {topEventsByViewsRows.length > 0 ? (
                  <BarList rows={topEventsByViewsRows} truncateLabels />
                ) : (
                  <span className="font-sans text-[1.4rem] text-neutral-500">
                    {t("noActivity")}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-8 pt-10 lg:pt-0 lg:pl-[2.5rem] min-w-0">
                <PanelTitle>{t("reviews.title")}</PanelTitle>
                <StarRatingChart
                  distribution={analytics.reviewDistribution}
                  average={analytics.average}
                  total={analytics.totalReviews}
                />
              </div>
            </Reveal>
          </>
        )}
      </div>
    </OrganizerLayout>
  );
}
