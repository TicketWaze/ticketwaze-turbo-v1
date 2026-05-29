import AdminLayout from "@/components/Layouts/AdminLayout";
import AnalyticsPageTopbar from "./AnalyticsPageTopbar";
import { useTranslations } from "next-intl";
import BarChart from "./BarChart";
import { InfoCircle } from "iconsax-reactjs";
import UserGrowthChart from "./UserGrowthChat";
import RevenueGrowthChart from "./RevenueGrowthChart";
import Image from "next/image";
import ArrowUp from "@ticketwaze/ui/assets/icons/arrow-up.svg";

export default function AnalyticsPageContent() {
  const t = useTranslations("Analytics");
  const top_e = 1;
  return (
    <AdminLayout>
      <>
        <AnalyticsPageTopbar
          title={t("title")}
          filter1={t("filters.first.all")}
          filter={t("filters.first.date")}
          className="pb-16"
        />
        <div className={"flex flex-col gap-12 overflow-y-scroll lg:gap-16"}>
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
                       <span className="pl-4 flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
                        80%
                        <Image
                          src={ArrowUp}
                          alt="arrow up"
                          width={20}
                          height={20}
                        />
                      </span>
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    20,553,758.90{" "}
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
                       <span className="pl-4 flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
                        80%
                        <Image
                          src={ArrowUp}
                          alt="arrow up"
                          width={20}
                          height={20}
                        />
                      </span>
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px] mt-4"
                    }
                  >
                    1,500,000
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
                       <span className="pl-4 flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
                        80%
                        <Image
                          src={ArrowUp}
                          alt="arrow up"
                          width={20}
                          height={20}
                        />
                      </span>
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    1,250,000
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
                       <span className="pl-4 flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
                        80%
                        <Image
                          src={ArrowUp}
                          alt="arrow up"
                          width={20}
                          height={20}
                        />
                      </span>
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    250,000
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
                       <span className="pl-4 flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
                        80%
                        <Image
                          src={ArrowUp}
                          alt="arrow up"
                          width={20}
                          height={20}
                        />
                      </span>
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    4,954
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
                       <span className="pl-4 flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
                        80%
                        <Image
                          src={ArrowUp}
                          alt="arrow up"
                          width={20}
                          height={20}
                        />
                      </span>
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px] mt-4"
                    }
                  >
                    8,339,120
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
                       <span className="pl-4 flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
                        80%
                        <Image
                          src={ArrowUp}
                          alt="arrow up"
                          width={20}
                          height={20}
                        />
                      </span>
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    2.9
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
                      <span className="pl-4 flex text-success gap-[0.3] uppercase text-[1.1rem] leading-6 items-center mr-10">
                        80%
                        <Image
                          src={ArrowUp}
                          alt="arrow up"
                          width={20}
                          height={20}
                        />
                      </span>
                    </span>
                  </div>
                  <p
                    className={
                      "text-[16px] font-medium capitalize leading-loose font-primary lg:text-[25px]"
                    }
                  >
                    51,407,125.90{" "}
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
                <RevenueGrowthChart />
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
                    percent1={`5%`}
                    percent2={`18%`}
                    percent3={`89%`}
                  ></BarChart>
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
                  {top_e > 0 ? (
                    <BarChart
                      category1={`Cap-Haïtien Jazz Night`}
                      category2={`Sunset by the Sea`}
                      category3={`Wave beach rewind`}
                      percent1={`35%`}
                      percent2={`90%`}
                      percent3={`57%`}
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
              <div className={"flex flex-col gap-8 lg:gap-10"}>
                <div
                  className={
                    "flex text-[14px] font-sans justify-between text-gray-800 text-base font-medium leading-tight lg:text-[15px]"
                  }
                >
                  {t("income.revenue")}
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
                <UserGrowthChart />
              </div>
            </div>
          </div>

          <div></div>
        </div>
      </>
    </AdminLayout>
  );
}
