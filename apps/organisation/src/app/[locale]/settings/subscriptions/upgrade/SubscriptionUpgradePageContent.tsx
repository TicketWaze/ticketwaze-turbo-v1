"use client";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { MembershipTier } from "@ticketwaze/typescript-config";
import { Crown } from "iconsax-reactjs";
import { toast } from "sonner";

export default function SubscriptionUpgradePageContent({
  membershipTier,
}: {
  membershipTier: MembershipTier;
}) {
  const t = useTranslations("Settings.subscriptions");
  return (
    <div className="overflow-y-scroll">
      <div
        className={
          "flex flex-col lg:flex-row items-stretch w-full justify-between gap-[20px]"
        }
      >
        {/*  PRO*/}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={
            "bg-white flex-1 border-2 border-primary-500 rounded-[30px] p-4 w-full flex flex-col gap-8 justify-between"
          }
        >
          <div className="flex flex-col gap-8">
            <div
              className={
                "bg-primary-900 text-white rounded-[20px] p-8 flex flex-col gap-[50px]"
              }
            >
              <div className={"flex items-start justify-between w-full"}>
                <span
                  className={
                    " font-medium flex-1 word-wrap text-[1.5rem] leading-[20px]"
                  }
                >
                  {t("pro.subtitle")}
                </span>
                <span
                  className={
                    " font-bold text-[1.1rem] leading-[15px] px-[5px] py-[2.5px] bg-primary-500 rounded-[30px]"
                  }
                >
                  {membershipTier.membershipName === "pro"
                    ? t("pro.tag")
                    : t("pro.most")}
                </span>
              </div>
              <span
                className={
                  " text-[2.5rem] lg:text-[5rem] leading-[100%] font-primary font-medium text-center"
                }
              >
                {t("pro.title")}
              </span>
            </div>
            <ul
              className={
                "text-[1.4rem] lg:text-[1.6rem] text-black leading-[28px] lg:leading-[35.5px]"
              }
            >
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("pro.list.1")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("pro.list.2")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("pro.list.3")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("pro.list.4")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("pro.list.5")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("pro.list.6")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("pro.list.7")}</span>
              </li>
            </ul>
          </div>
          {membershipTier.membershipName === "free" && (
            <div className="p-[2px] rounded-[30px] bg-gradient-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
              <button
                onClick={() => toast.info(t("soon"))}
                className="px-12 py-5 rounded-[10rem] cursor-pointer w-full text-white font-medium  flex items-center justify-center gap-4 text-[1.4rem] leading-8 text-center"
              >
                <Crown size="24" color="#fff" variant="Bulk" />
                {t("upgrade")}
              </button>
            </div>
          )}
        </motion.div>

        {/*  PREMIUM*/}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-1  p-[2px] rounded-[30px] bg-gradient-to-r from-primary-500 via-[#E752AE] to-[#DD068B]"
        >
          <div
            className={
              "bg-neutral-100 rounded-[30px] p-4 w-full flex flex-col justify-between gap-8"
            }
          >
            <div className={"flex flex-col gap-8 "}>
              <div
                className={
                  "bg-white rounded-[20px] p-8 flex flex-col gap-[50px]"
                }
              >
                <div className={"flex items-start justify-between w-full"}>
                  <span
                    className={
                      " font-medium flex-1 word-wrap text-[1.5rem] leading-[20px]"
                    }
                  >
                    {t("premium.subtitle")}
                  </span>
                  {membershipTier.membershipName === "premium" && (
                    <span
                      className={
                        " font-bold text-[1.1rem] text-white leading-[15px] px-[5px] py-[2.5px] bg-primary-500 rounded-[30px]"
                      }
                    >
                      {t("pro.tag")}
                    </span>
                  )}
                </div>
                <span
                  className={
                    "text-black text-[2.5rem] lg:text-[5rem] leading-[100%] font-primary font-medium text-center"
                  }
                >
                  {t("premium.title")}
                </span>
              </div>
              <ul
                className={
                  "text-[1.4rem] lg:text-[1.6rem] text-black leading-[28px] lg:leading-[35.5px]"
                }
              >
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("premium.list.1")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("premium.list.2")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("premium.list.3")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("premium.list.4")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("premium.list.5")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("premium.list.6")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("premium.list.7")}</span>
                  <VerifiedOrganisationCheckMark />
                </li>
              </ul>
            </div>
            {membershipTier.membershipName !== "premium" && (
              <div className="p-[2px] rounded-[30px] bg-gradient-to-r from-primary-500 via-[#E752AE] to-[#DD068B]">
                <button
                  onClick={() => toast.info(t("soon"))}
                  className="px-12 py-5 rounded-[10rem] cursor-pointer w-full text-white font-medium  flex items-center justify-center gap-4 text-[1.4rem] leading-8 text-center"
                >
                  <Crown size="24" color="#fff" variant="Bulk" />
                  {t("upgrade")}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
