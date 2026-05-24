import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import AnalyticsPageTopbar from "./AnalyticsPageTopbar";
import { auth } from "@/lib/auth";
import { getLocale, getTranslations } from "next-intl/server";
import { organisationPolicy } from "@/lib/role/organisationPolicy";
import DailyTicketSalesChart from "./DailyTicketSalesChart";
import BarChart from "./BarChart";
import UnauthorizedView from "@/components/Layouts/UnauthorizedView";
import { redirect } from "next/navigation";
import { Crown, InfoCircle } from "iconsax-reactjs";
import ProFeatureAlert from "@/components/Layouts/ProFeatureAlert";
import { LinkPrimary } from "@/components/shared/Links";
import Separator from "@/components/shared/Separator";
import TicketClassesChart from "./TicketClassesChart";
import RevenueTicketsChart from "./RevenueTicketsChart";
import DonutChart from "./DonutChart";
import StarRatingChart from "./StarRatingChart";

export default async function AnalyticsPage() {
  const session = await auth();
  const currentOrganisation = session?.activeOrganisation;
  const currentOrganisationId = session?.activeOrganisation?.organisationId;
  if (!session?.user) {
    redirect(`/auth/login`);
  }
  if (!session?.activeOrganisation?.organisationId) {
    redirect(`/auth/logout`);
  }

  const authorized = await organisationPolicy.viewReports(
    session.user.userId ?? "",
    currentOrganisationId ?? "",
  );
  if (!authorized) return <UnauthorizedView />;

  const t = await getTranslations("Analytics");
  const locale = await getLocale();
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organisations/${currentOrganisationId}/analytics`,
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
  // if (request.status === 403) {
  //   return <UnauthorizedView />;
  // }
  const analytics = await request.json();

  /* ── Derived data for new sections ── */
  const isFree = analytics.membershipTier?.membershipName === "free";

  const genderItems = Object.entries(
    (analytics.genderPercentages ?? {}) as Record<string, number>,
  ).map(([key, value]) => {
    const colorMap: Record<string, string> = {
      male: "#60A5FA",
      female: "#F472B6",
      other: "#A78BFA",
      others: "#A78BFA",
    };
    return {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: colorMap[key.toLowerCase()] ?? "#D1D5DB",
    };
  });

  const guestVsRegisteredItems = [
    {
      label: t("audience.guest"),
      value: analytics.guestVsRegistered?.guest?.count ?? 0,
      color: "#FBBF24",
    },
    {
      label: t("audience.registered"),
      value: analytics.guestVsRegistered?.registered?.count ?? 0,
      color: "#34D399",
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
        percentage: number;
      }>
    )?.map((p, i) => ({
      label: p.provider.charAt(0).toUpperCase() + p.provider.slice(1),
      value: p.count,
      color:
        providerColorMap[p.provider.toLowerCase()] ??
        `hsl(${(i * 67) % 360}, 65%, 55%)`,
    })) ?? [];

  const topEventsByTicketsItems =
    (
      analytics.topEvents as Array<{
        eventName: string;
        ticketsSold: number;
        revenue: number;
        percentage: string;
      }>
    )
      ?.slice(0, 5)
      .map((e) => ({
        label: e.eventName,
        value: e.percentage,
      })) ?? [];

  const topEventsByViewsArr =
    (analytics.topEventsByViews as Array<{
      eventName: string;
      viewCount: number;
    }>) ?? [];
  const totalViews = topEventsByViewsArr.reduce(
    (sum, e) => sum + e.viewCount,
    0,
  );
  const topEventsByViewsItems = topEventsByViewsArr.slice(0, 5).map((e) => ({
    label: e.eventName,
    value: totalViews > 0 ? ((e.viewCount / totalViews) * 100).toFixed(1) : "0",
  }));

  return (
    <OrganizerLayout title="Analytics">
      <AnalyticsPageTopbar
        isVerified={currentOrganisation?.isVerified ?? false}
        title={currentOrganisation?.organisationName ?? ""}
        description={t("description")}
        membershipTier={analytics.membershipTier}
      />
      {/* main */}
      <div className={"flex flex-col gap-12 overflow-y-scroll lg:gap-16"}>
        <div
          className={
            "grid grid-cols-2 lg:divide-x divide-neutral-100 border-neutral-100 lg:border-b lg:grid-cols-4"
          }
        >
          <div className={" border-b lg:border-b-0"}>
            <div
              className={
                "mb-8 border-r border-neutral-100 pr-10 lg:pb-12 lg:mb-0 lg:border-r-0"
              }
            >
              <div className={"flex justify-between"}>
                <span
                  className={
                    "text-start text-[14px] text-neutral-600 font-sans leading-tight pb-6"
                  }
                >
                  {t("revenue")}
                </span>
              </div>
              <p
                className={
                  "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                }
              >
                {analytics.totalRevenue}{" "}
                <span className={"font-normal text-neutral-500"}>USD</span>
              </p>
            </div>
          </div>

          <div className={" border-b lg:border-b-0"}>
            <div className={"pl-10 mb-8 lg:px-10 lg:pb-12 lg:mb-0"}>
              <div className={"flex justify-between"}>
                <span
                  className={
                    "text-start text-[14px] text-neutral-600 font-sans leading-tight pb-2"
                  }
                >
                  {t("sold")}
                </span>
              </div>
              <p
                className={
                  "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px] mt-4"
                }
              >
                {analytics.totalTicketsSold}
              </p>
            </div>
          </div>

          <div>
            <div
              className={
                "mt-8 pr-1 border-r border-neutral-100 lg:px-10 lg:pb-12 lg:mt-0 lg:border-r-0"
              }
            >
              <div className={"flex justify-between"}>
                <span
                  className={
                    "text-start text-[14px] text-neutral-600 font-sans leading-tight pb-6"
                  }
                >
                  {t("content.upcomingTitle")}
                </span>
              </div>
              <p
                className={
                  "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                }
              >
                {analytics.upcomingEvents}
              </p>
            </div>
          </div>

          <div>
            <div className={"mt-8 pl-10 lg:pb-12 lg:mt-0"}>
              <div className={"flex justify-between"}>
                <span
                  className={
                    "text-start text-[14px] text-neutral-600 font-sans leading-tight pb-6"
                  }
                >
                  {t("content.followers")}
                </span>
              </div>
              <p
                className={
                  "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                }
              >
                {analytics.followers}
              </p>
            </div>
          </div>
        </div>

        {/* tickets analytic stat */}
        <div className={"flex flex-col gap-8 lg:gap-10"}>
          <h3
            className={
              "self-stretch justify-start font-medium font-primary text-[18px] leading-loose text-black lg:text-[22px]"
            }
          >
            {t("tickets.title")}
          </h3>
          <div
            className={
              "grid-cols-1 grid  lg:grid-cols-21 lg:divide-x divide-neutral-100 border-neutral-100 lg:border-b"
            }
          >
            <div
              className={"w-full pt-6 pb-8 lg:pr-12 lg:pb-12 lg:col-span-11 "}
            >
              <div className={"flex flex-col gap-8 lg:gap-10"}>
                <span
                  className={
                    "text-[14px] font-sans justify-start text-gray-800 text-base font-medium leading-tight lg:text-[15px]"
                  }
                >
                  {t("tickets.daily")}
                </span>
                <DailyTicketSalesChart ticketSales={analytics.ticketSales} />
              </div>
            </div>
            <div
              className={
                "flex flex-col gap-8 w-full lg:flex-row col-span-10 lg:pt-6 lg:pb-12 lg:pl-12"
              }
            >
              <TicketClassesChart analytics={analytics} />
            </div>
          </div>
        </div>

        {/* event analytic stat */}
        <div className={"flex flex-col gap-8 lg:gap-10"}>
          <h3
            className={
              "font-medium font-primary text-[18px] leading-12 text-black lg:text-[22px]"
            }
          >
            {t("event.event_demographics.title")}
          </h3>
          <div
            className={
              "grid grid-cols-1 divide-y lg:grid-cols-2  lg:divide-x lg:divide-y-0 divide-neutral-100 border-neutral-100 lg:border-b"
            }
          >
            <div className={"flex flex-col gap-9 pb-6 lg:pr-10 lg:pb-8 "}>
              <span
                className={
                  "text-[14px] text-black-100 font-sans font-medium lg:text-[15px]"
                }
              >
                {t("event.event_demographics.gender_distribution.title")}
              </span>
              {analytics.membershipTier.membershipName === "free" ? (
                <ProFeatureAlert />
              ) : (
                <div className={"w-full"}>
                  <BarChart
                    category1={t(
                      "event.event_demographics.gender_distribution.gender.male",
                    )}
                    category2={t(
                      "event.event_demographics.gender_distribution.gender.female",
                    )}
                    category3={t(
                      "event.event_demographics.gender_distribution.gender.others",
                    )}
                    percent1={`${Math.round(analytics.genderPercentages?.male ?? 0)}%`}
                    percent2={`${Math.round(analytics.genderPercentages?.female ?? 0)}%`}
                    percent3={`${Math.round(analytics.genderPercentages?.other ?? analytics.genderPercentages?.others ?? 0)}%`}
                  ></BarChart>
                </div>
              )}
            </div>
            <div className={"flex flex-col gap-9 lg:pl-10 lg:pb-8 "}>
              <span
                className={
                  "text-[14px] text-black-100 font-medium lg:text-[15px]"
                }
              >
                {t("event.event_demographics.events_top.title")}
              </span>
              <div className={"w-full"}>
                {analytics.topEvents.length > 0 ? (
                  <BarChart
                    category1={analytics.topEvents[0].eventName}
                    category2={analytics.topEvents[1]?.eventName}
                    category3={analytics.topEvents[2]?.eventName}
                    percent1={analytics.topEvents[0]?.percentage}
                    percent2={analytics.topEvents[1]?.percentage}
                    percent3={analytics.topEvents[2]?.percentage}
                  />
                ) : (
                  <div className="flex flex-col justify-center items-center gap-4">
                    <InfoCircle size="32" color="#D5D8DC" />
                    <span className="font-primary text-[1.2rem] text-neutral-500">
                      {t("noActivity")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {analytics.membershipTier.membershipName === "free" && (
          <div className="lg:hidden">
            <Separator />
          </div>
        )}
        {/* feedback analytic */}
        {analytics.membershipTier.membershipName === "free" ? (
          <div className="flex items-center flex-col gap-8">
            <div className="flex items-center flex-col gap-4">
              <InfoCircle size="32" color="#D5D8DC" />
              <span className="font-primary text-[1.4rem] text-neutral-500 text-center">
                {t("upgradeAlert")}
              </span>
            </div>
            <div className="flex-1 p-[.2rem] rounded-[30px] bg-linear-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
              <LinkPrimary
                className="bg-transparent gap-4 py-2 items-center"
                href="/settings/subscriptions/upgrade"
              >
                <Crown size="24" color="#fff" variant="Bulk" />
                {t("upgrade")}
              </LinkPrimary>
            </div>
          </div>
        ) : (
          <>
            <div className={"flex flex-col gap-10 mb-6"}>
              <h3
                className={
                  "font-medium font-primary text-[18px] text-black lg:text-[22px]"
                }
              >
                {t("feedback.title")}
              </h3>
              <div
                className={"flex flex-col gap-6 lg:flex-row lg:justify-between"}
              >
                <div className={"flex flex-col gap-4"}>
                  <span className={"text-[14px] text-neutral-500 font-sm"}>
                    {t("feedback.action.add_favorite")}
                  </span>
                  <p
                    className={
                      "font-medium text-[25px] text-black capitalize font-primary"
                    }
                  >
                    {analytics.favorites}
                  </p>
                </div>

                <div className={"flex flex-col gap-4"}>
                  <span className={"text-[14px] text-neutral-500 font-sm"}>
                    {t("feedback.action.rated")}
                  </span>
                  <div
                    className={
                      "flex font-medium text-[25px] capitalize font-primary"
                    }
                  >
                    <p className={" text-black "}>{analytics.average}</p>
                    <span className={"text-neutral-500"}>/5</span>
                  </div>
                </div>
                <div className={"flex flex-col gap-4"}>
                  <span className={"text-[14px] text-neutral-500  font-sm"}>
                    {t("feedback.action.reviews")}
                  </span>
                  <p
                    className={
                      "font-medium text-[25px] text-black capitalize font-primary"
                    }
                  >
                    {analytics.totalReviews}
                  </p>
                </div>
              </div>
            </div>
            {/* ── NEW SECTIONS ── */}

            {/* KPI extras: orders, avg order value, total events, past events, conversion, check-in, refund, shares */}
            <div className="flex flex-col gap-8 lg:gap-10">
              <h3 className="font-medium font-primary text-[18px] leading-loose text-black lg:text-[22px]">
                {t("kpi.title")}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 border-b border-neutral-100">
                <div className="px-4 py-6 lg:px-6">
                  <span className="text-[14px] text-neutral-600 font-sans leading-tight pb-2 block">
                    {t("kpi.orders")}
                  </span>
                  <p className="text-[16px] lg:text-[25px] font-medium font-primary leading-loose">
                    {analytics.totalOrders}
                  </p>
                </div>
                <div className="px-4 py-6 lg:px-6">
                  <span className="text-[14px] text-neutral-600 font-sans leading-tight pb-2 block">
                    {t("kpi.avgOrderValue")}
                  </span>
                  <p className="text-[16px] lg:text-[25px] font-medium font-primary leading-loose">
                    {analytics.averageOrderValue}{" "}
                    <span className="font-normal text-neutral-500">USD</span>
                  </p>
                </div>
                <div className="px-4 py-6 lg:px-6">
                  <span className="text-[14px] text-neutral-600 font-sans leading-tight pb-2 block">
                    {t("kpi.totalEvents")}
                  </span>
                  <p className="text-[16px] lg:text-[25px] font-medium font-primary leading-loose">
                    {analytics.totalEvents}
                  </p>
                </div>
                <div className="px-4 py-6 lg:px-6">
                  <span className="text-[14px] text-neutral-600 font-sans leading-tight pb-2 block">
                    {t("kpi.pastEvents")}
                  </span>
                  <p className="text-[16px] lg:text-[25px] font-medium font-primary leading-loose">
                    {analytics.pastEvents}
                  </p>
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="flex flex-col gap-8 lg:gap-10">
              <h3 className="font-medium font-primary text-[18px] leading-loose text-black lg:text-[22px]">
                {t("engagement.title")}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-neutral-100 border-b border-neutral-100">
                <div className="px-4 py-6 lg:px-6">
                  <span className="text-[14px] text-neutral-600 font-sans leading-tight pb-2 block">
                    {t("engagement.views")}
                  </span>
                  <p className="text-[16px] lg:text-[25px] font-medium font-primary leading-loose">
                    {analytics.eventViews}
                  </p>
                </div>
                <div className="px-4 py-6 lg:px-6">
                  <span className="text-[14px] text-neutral-600 font-sans leading-tight pb-2 block">
                    {t("engagement.shares")}
                  </span>
                  <p className="text-[16px] lg:text-[25px] font-medium font-primary leading-loose">
                    {analytics.socialShares}
                  </p>
                </div>
                <div className="px-4 py-6 lg:px-6">
                  <span className="text-[14px] text-neutral-600 font-sans leading-tight pb-2 block">
                    {t("engagement.conversion")}
                  </span>
                  <p className="text-[16px] lg:text-[25px] font-medium font-primary leading-loose">
                    {analytics.conversionRate}
                    <span className="font-normal text-neutral-500">%</span>
                  </p>
                </div>
                <div className="px-4 py-6 lg:px-6">
                  <span className="text-[14px] text-neutral-600 font-sans leading-tight pb-2 block">
                    {t("engagement.checkIn")}
                  </span>
                  <p className="text-[16px] lg:text-[25px] font-medium font-primary leading-loose">
                    {analytics.checkInRate}
                    <span className="font-normal text-neutral-500">%</span>
                  </p>
                </div>
                <div className="px-4 py-6 lg:px-6">
                  <span className="text-[14px] text-neutral-600 font-sans leading-tight pb-2 block">
                    {t("engagement.refund")}
                  </span>
                  <p className="text-[16px] lg:text-[25px] font-medium font-primary leading-loose">
                    {analytics.refundRate}
                    <span className="font-normal text-neutral-500">%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Revenue & Tickets chart */}
            <div className="flex flex-col gap-8 lg:gap-10">
              <h3 className="font-medium font-primary text-[18px] leading-loose text-black lg:text-[22px]">
                {t("chart.monthly")}
              </h3>
              <RevenueTicketsChart
                revenueByMonth={analytics.revenueByMonth}
                ticketsByMonth={analytics.ticketsByMonth}
              />
            </div>

            {/* Audience donuts */}
            <div className="flex flex-col gap-8 lg:gap-10">
              <h3 className="font-medium font-primary text-[18px] leading-loose text-black lg:text-[22px]">
                {t("audience.title")}
              </h3>
              {isFree ? (
                <ProFeatureAlert />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100 border-neutral-100 lg:border-b pb-8">
                  <div className="py-6 lg:pr-10 lg:py-0">
                    <DonutChart
                      title={t("audience.gender")}
                      items={genderItems}
                    />
                  </div>
                  <div className="py-6 lg:px-10 lg:py-0">
                    <DonutChart
                      title={t("audience.guestVsRegistered")}
                      items={guestVsRegisteredItems}
                    />
                  </div>
                  <div className="py-6 lg:pl-10 lg:py-0">
                    <DonutChart
                      title={t("audience.paymentProviders")}
                      items={paymentProviderItems}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Top events by tickets & by views */}
            <div className="flex flex-col gap-8 lg:gap-10">
              <h3 className="font-medium font-primary text-[18px] leading-loose text-black lg:text-[22px]">
                {t("topEvents.title")}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-100 border-neutral-100 lg:border-b">
                <div className="flex flex-col gap-6 pb-8 lg:pr-10 lg:pb-10">
                  <span className="text-[14px] font-medium font-sans text-gray-800">
                    {t("topEvents.byTickets")}
                  </span>
                  {topEventsByTicketsItems.length > 0 ? (
                    <table className="w-full border-separate border-spacing-y-3">
                      <tbody>
                        {topEventsByTicketsItems.map(({ label, value }, i) => {
                          const num = parseFloat(value);
                          return (
                            <tr key={i}>
                              <td className="w-24 pr-4 max-w-48">
                                <span className="text-[14px] font-sans text-black-100 whitespace-nowrap truncate block">
                                  {label}
                                </span>
                              </td>
                              <td className="w-full px-4">
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                    style={{
                                      width: isNaN(num) ? "0%" : `${num}%`,
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="w-16 pl-4 text-right">
                                <span className="text-[14px] font-sans text-black-100 whitespace-nowrap">
                                  {isNaN(num) ? "0%" : `${value}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col justify-center items-center gap-4">
                      <InfoCircle size="32" color="#D5D8DC" />
                      <span className="font-primary text-[1.2rem] text-neutral-500">
                        {t("noActivity")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-6 pt-8 lg:pt-0 lg:pl-10 lg:pb-10">
                  <span className="text-[14px] font-medium font-sans text-gray-800">
                    {t("topEvents.byViews")}
                  </span>
                  {topEventsByViewsItems.length > 0 ? (
                    <table className="w-full border-separate border-spacing-y-3">
                      <tbody>
                        {topEventsByViewsItems.map(({ label, value }, i) => {
                          const num = parseFloat(value);
                          return (
                            <tr key={i}>
                              <td className="w-24 pr-4 max-w-48">
                                <span className="text-[14px] font-sans text-black-100 whitespace-nowrap truncate block">
                                  {label}
                                </span>
                              </td>
                              <td className="w-full px-4">
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                    style={{
                                      width: isNaN(num) ? "0%" : `${num}%`,
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="w-16 pl-4 text-right">
                                <span className="text-[14px] font-sans text-black-100 whitespace-nowrap">
                                  {isNaN(num) ? "0%" : `${value}%`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col justify-center items-center gap-4">
                      <InfoCircle size="32" color="#D5D8DC" />
                      <span className="font-primary text-[1.2rem] text-neutral-500">
                        {t("noActivity")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews / Star rating */}
            <div className="flex flex-col gap-8 lg:gap-10">
              <h3 className="font-medium font-primary text-[18px] leading-loose text-black lg:text-[22px]">
                {t("reviews.title")}
              </h3>
              {isFree ? (
                <ProFeatureAlert />
              ) : (
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-16 border-b border-neutral-100 pb-10">
                  <div className="flex-1">
                    <StarRatingChart
                      distribution={analytics.reviewDistribution}
                      average={analytics.average}
                      total={analytics.totalReviews}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div></div>
      </div>
    </OrganizerLayout>
  );
}
