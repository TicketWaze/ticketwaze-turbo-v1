import AdminLayout from "@/components/Layouts/AdminLayout";
import AnalyticsPageTopbar from "./AnalyticsPageTopbar";
import { useTranslations } from "next-intl";
import BarChart from "./BarChart";
import { InfoCircle } from "iconsax-reactjs";
import UserGrowthChart from "./UserGrowthChat";
import RevenueGrowthChart from "./RevenueGrowthChart";
import Image from "next/image";
import ArrowUp from "@ticketwaze/ui/assets/icons/arrow-up.svg";
import ArrowDown from "@ticketwaze/ui/assets/icons/arrow-down.svg";

type ChartPoint = { label: string; value: number };
type UserGrowthPoint = { label: string; attendees: number; organizers: number };
type TopEvent = { name: string; percent: number };

export type AnalyticsData = {
  stats: {
    totalRevenue: number;
    totalRevenueGrowth: number;
    totalUsers: number;
    totalUsersGrowth: number;
    totalAttendees: number;
    totalAttendeesGrowth: number;
    totalOrganizers: number;
    totalOrganizersGrowth: number;
    totalEvents: number;
    totalEventsGrowth: number;
    totalTicketsSold: number;
    totalTicketsSoldGrowth: number;
    avgTicketsPerAttendee: number;
    avgTicketsGrowth: number;
    topOrganizerRevenue: number;
    topOrganizerRevenueGrowth: number;
  };
  revenueChart: ChartPoint[];
  userGrowthChart: UserGrowthPoint[];
  genderDistribution: {
    malePercent: number;
    femalePercent: number;
    othersPercent: number;
  };
  topEvents: TopEvent[];
  topOrganizers: TopEvent[];
  paymentMethods: { provider: string; percent: number }[];
  activityStatus: { approved: number; inReview: number; rejected: number };
};

function GrowthBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <span
      className={`pl-4 flex gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10 ${isPositive ? "text-success" : "text-red-500"}`}
    >
      {Math.abs(value)}%
      <Image
        src={isPositive ? ArrowUp : ArrowDown}
        alt={isPositive ? "arrow up" : "arrow down"}
        width={20}
        height={20}
      />
    </span>
  );
}

export default function AnalyticsPageContent({
  data,
}: {
  data: AnalyticsData;
}) {
  const t = useTranslations("Analytics");
  const {
    stats,
    revenueChart,
    userGrowthChart,
    genderDistribution,
    topEvents,
    topOrganizers,
    paymentMethods,
    activityStatus,
  } = data;

  return (
    <AdminLayout>
      <>
        <AnalyticsPageTopbar
          title={t("title")}
          filter1={t("filters.first.all")}
          filter={t("filters.first.date")}
          className="pb-16"
        />
        <div
          className={
            "flex flex-col gap-12 overflow-y-scroll overflow-x-hidden lg:gap-16"
          }
        >
          <div>
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
                        "flex justify-between text-start text-[14px] text-neutral-600 font-sans leading-tight pb-6"
                      }
                    >
                      {t("revenue")}
                      <GrowthBadge value={stats.totalRevenueGrowth} />
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    {stats.totalRevenue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className={"font-normal text-neutral-500"}>USD</span>
                  </p>
                </div>
              </div>

              <div className={" border-b lg:border-b-0"}>
                <div className={"pl-10 mb-8 lg:px-10 lg:pb-12 lg:mb-0"}>
                  <div className={"flex justify-between"}>
                    <span
                      className={
                        "flex justify-between text-start text-[14px] text-neutral-600 font-sans leading-tight pb-2"
                      }
                    >
                      {t("users_registered")}
                      <GrowthBadge value={stats.totalUsersGrowth} />
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px] mt-4"
                    }
                  >
                    {stats.totalUsers.toLocaleString()}
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
                        "flex justify-between text-start text-[14px] text-neutral-600 font-sans leading-tight pb-6"
                      }
                    >
                      {t("attendees_registered")}
                      <GrowthBadge value={stats.totalAttendeesGrowth} />
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    {stats.totalAttendees.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <div className={"mt-8 pl-10 lg:pb-12 lg:mt-0"}>
                  <div className={"flex justify-between"}>
                    <span
                      className={
                        "flex justify-between text-start text-[14px] text-neutral-600 font-sans leading-tight pb-6"
                      }
                    >
                      {t("organizers_registered")}
                      <GrowthBadge value={stats.totalOrganizersGrowth} />
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    {stats.totalOrganizers.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={
                "grid grid-cols-2 lg:divide-x divide-neutral-100 border-neutral-100 lg:grid-cols-4"
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
                        "flex justify-between text-start pt-12 text-[14px] text-neutral-600 font-sans leading-tight pb-6"
                      }
                    >
                      {t("activity_created")}
                      <GrowthBadge value={stats.totalEventsGrowth} />
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    {stats.totalEvents.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className={" border-b lg:border-b-0"}>
                <div className={"pl-10 mb-8 lg:px-10  lg:mb-0"}>
                  <div className={"flex justify-between"}>
                    <span
                      className={
                        "flex justify-between text-start pt-12 text-[14px] text-neutral-600 font-sans leading-tight pb-2"
                      }
                    >
                      {t("sold")}
                      <GrowthBadge value={stats.totalTicketsSoldGrowth} />
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px] mt-4"
                    }
                  >
                    {stats.totalTicketsSold.toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <div
                  className={
                    "mt-8 pr-1 border-r border-neutral-100 lg:px-10 lg:mt-0 lg:border-r-0"
                  }
                >
                  <div className={"flex justify-between"}>
                    <span
                      className={
                        "flex justify-between text-start pt-12 text-[14px] text-neutral-600 font-sans leading-tight pb-6"
                      }
                    >
                      {t("avg_tickets")}
                      <GrowthBadge value={stats.avgTicketsGrowth} />
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    {stats.avgTicketsPerAttendee}
                  </p>
                </div>
              </div>

              <div>
                <div className={"mt-8 pl-10 pt-12 lg:mt-0"}>
                  <div className={"flex justify-between"}>
                    <span
                      className={
                        "flex justify-between text-start  text-[14px] text-neutral-600 font-sans leading-tight pb-6"
                      }
                    >
                      {t("top_organizer_revenue")}
                      <GrowthBadge value={stats.topOrganizerRevenueGrowth} />
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    {stats.topOrganizerRevenue.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className={"font-normal text-neutral-500"}>USD</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* income performance */}
          <div className={"flex flex-col gap-8 lg:gap-10"}>
            <h3
              className={
                "self-stretch justify-start font-medium font-primary text-[18px] leading-loose text-black lg:text-[22px]"
              }
            >
              {t("income.title")}
            </h3>
            <div
              className={"w-full pt-6 pb-8 lg:pr-12 lg:pb-12 lg:col-span-11 "}
            >
              <div className={"flex flex-col gap-8 lg:gap-10"}>
                <span
                  className={
                    "text-[14px] font-sans justify-start text-gray-800 text-base font-medium leading-tight lg:text-[15px]"
                  }
                >
                  {t("income.revenue")}
                </span>
                <RevenueGrowthChart data={revenueChart} />
              </div>
            </div>
          </div>

          {/* user analytic stat */}
          <div className={"flex flex-col gap-8 lg:gap-10"}>
            <h3
              className={
                "font-medium font-primary text-[18px] leading-12 text-black lg:text-[22px]"
              }
            >
              {t("user_demographics.title")}
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
                  {t("user_demographics.gender_distribution.title")}
                </span>
                <div className={"w-full"}>
                  <BarChart
                    category1={t(
                      "user_demographics.gender_distribution.gender.male",
                    )}
                    category2={t(
                      "user_demographics.gender_distribution.gender.female",
                    )}
                    category3={t(
                      "user_demographics.gender_distribution.gender.others",
                    )}
                    percent1={`${genderDistribution.malePercent}%`}
                    percent2={`${genderDistribution.femalePercent}%`}
                    percent3={`${genderDistribution.othersPercent}%`}
                  />
                </div>
              </div>
              <div className={"flex flex-col gap-9 lg:pl-10 lg:pb-8 "}>
                <span
                  className={
                    "text-[14px] text-black-100 font-medium lg:text-[15px]"
                  }
                >
                  {t("user_demographics.events_top.title")}
                </span>
                <div className={"w-full"}>
                  {topEvents.length > 0 && topEvents[0].name ? (
                    <BarChart
                      category1={topEvents[0]?.name}
                      category2={topEvents[1]?.name}
                      category3={topEvents[2]?.name}
                      percent1={
                        topEvents[0] ? `${topEvents[0].percent}%` : undefined
                      }
                      percent2={
                        topEvents[1] ? `${topEvents[1].percent}%` : undefined
                      }
                      percent3={
                        topEvents[2] ? `${topEvents[2].percent}%` : undefined
                      }
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

          {/* growth */}
          <div className={"flex flex-col gap-8 lg:gap-10"}>
            <h3
              className={
                "self-stretch justify-start font-medium font-primary text-[18px] leading-loose text-black lg:text-[22px]"
              }
            >
              {t("user.title")}
            </h3>
            <div
              className={"w-full pt-6 pb-8 lg:pr-12 lg:pb-12 lg:col-span-11 "}
            >
              <div className={"flex flex-col gap-4 lg:gap-10"}>
                <div
                  className={
                    "flex text-[14px] font-sans justify-between text-gray-800 text-base font-medium leading-tight lg:text-[15px]"
                  }
                >
                  {/* {t("income.revenue")} */}
                  <div className="flex gap-6 ">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary-500"></div>
                      <span className="text-[1.4rem] leading-8 text-neutral-600">
                        {t("user.chart.attendee")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary-50"></div>
                      <span className="text-[1.4rem] leading-8 text-neutral-600">
                        {t("user.chart.organizer")}
                      </span>
                    </div>
                  </div>
                </div>
                <UserGrowthChart data={userGrowthChart} />
              </div>
            </div>
          </div>

          {/* platform health */}
          <div className={"flex flex-col gap-8 lg:gap-10"}>
            <h3
              className={
                "font-medium font-primary text-[18px] leading-12 text-black lg:text-[22px]"
              }
            >
              {t("platform_health.title")}
            </h3>
            <div
              className={
                "grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0 divide-neutral-100 border-neutral-100 lg:border-b"
              }
            >
              <div className={"flex flex-col gap-9 pb-6 lg:pr-10 lg:pb-8"}>
                <span className={"text-[14px] text-black-100 font-sans font-medium lg:text-[15px]"}>
                  {t("top_organizers.title")}
                </span>
                <div className={"w-full"}>
                  {topOrganizers.length > 0 && topOrganizers[0].name ? (
                    <BarChart
                      category1={topOrganizers[0]?.name}
                      category2={topOrganizers[1]?.name}
                      category3={topOrganizers[2]?.name}
                      percent1={topOrganizers[0] ? `${topOrganizers[0].percent}%` : undefined}
                      percent2={topOrganizers[1] ? `${topOrganizers[1].percent}%` : undefined}
                      percent3={topOrganizers[2] ? `${topOrganizers[2].percent}%` : undefined}
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
              <div className={"flex flex-col gap-9 lg:pl-10 lg:pb-8"}>
                <span className={"text-[14px] text-black-100 font-sans font-medium lg:text-[15px]"}>
                  {t("payment_methods.title")}
                </span>
                <div className={"w-full"}>
                  {paymentMethods.length > 0 ? (
                    <BarChart
                      category1={paymentMethods[0] ? paymentMethods[0].provider.charAt(0).toUpperCase() + paymentMethods[0].provider.slice(1) : undefined}
                      category2={paymentMethods[1] ? paymentMethods[1].provider.charAt(0).toUpperCase() + paymentMethods[1].provider.slice(1) : undefined}
                      category3={paymentMethods[2] ? paymentMethods[2].provider.charAt(0).toUpperCase() + paymentMethods[2].provider.slice(1) : undefined}
                      percent1={paymentMethods[0] ? `${paymentMethods[0].percent}%` : undefined}
                      percent2={paymentMethods[1] ? `${paymentMethods[1].percent}%` : undefined}
                      percent3={paymentMethods[2] ? `${paymentMethods[2].percent}%` : undefined}
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

          {/* activity status */}
          <div className={"flex flex-col gap-8 lg:gap-10"}>
            <h3
              className={
                "font-medium font-primary text-[18px] leading-12 text-black lg:text-[22px]"
              }
            >
              {t("activity_status.title")}
            </h3>
            <div
              className={
                "grid grid-cols-3 divide-x divide-neutral-100 border-neutral-100 border-b pb-12"
              }
            >
              <div className={"flex flex-col gap-4 pr-10"}>
                <div className="flex items-center gap-3">
                  <span className="w-[8px] h-[8px] rounded-full bg-green-500 flex-shrink-0" />
                  <span className={"text-[14px] text-neutral-600 font-sans leading-tight"}>
                    {t("activity_status.approved")}
                  </span>
                </div>
                <p className={"text-[16px] font-medium font-primary lg:text-[25px]"}>
                  {activityStatus.approved.toLocaleString()}
                </p>
              </div>
              <div className={"flex flex-col gap-4 px-10"}>
                <div className="flex items-center gap-3">
                  <span className="w-[8px] h-[8px] rounded-full bg-amber-400 flex-shrink-0" />
                  <span className={"text-[14px] text-neutral-600 font-sans leading-tight"}>
                    {t("activity_status.in_review")}
                  </span>
                </div>
                <p className={"text-[16px] font-medium font-primary lg:text-[25px]"}>
                  {activityStatus.inReview.toLocaleString()}
                </p>
              </div>
              <div className={"flex flex-col gap-4 pl-10"}>
                <div className="flex items-center gap-3">
                  <span className="w-[8px] h-[8px] rounded-full bg-red-400 flex-shrink-0" />
                  <span className={"text-[14px] text-neutral-600 font-sans leading-tight"}>
                    {t("activity_status.rejected")}
                  </span>
                </div>
                <p className={"text-[16px] font-medium font-primary lg:text-[25px]"}>
                  {activityStatus.rejected.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div></div>
        </div>
      </>
    </AdminLayout>
  );
}
