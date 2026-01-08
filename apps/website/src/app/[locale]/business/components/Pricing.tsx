"use client";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";

function Pricing() {
  const t = useTranslations("BusinessPage.pricing");
  return (
    <section
      id={"pricing"}
      className="bg-white py-[3rem] lg:py-[7.5rem] px-[1.5rem] lg:px-[10rem] rounded-[3rem] flex flex-col items-center lg:items-start gap-[3.5rem] lg:gap-[100px]"
    >
      <div
        className={
          "flex flex-col lg:flex-row items-start text-center lg:text-start gap-[15px] lg:gap-0"
        }
      >
        <h2
          className={
            "text-[3.2rem] lg:text-[4.5rem] font-primary font-bold text-deep-200 leading-[35px] lg:leading-[50px] flex-1"
          }
        >
          {t("title-1")}
          <span className={"text-primary-500"}>{t("title-2")}</span>
        </h2>
        <p
          className={
            "text-[1.6rem] lg:text-[2.6rem] text-neutral-700 leading-[22.5px] lg:leading-[35px] flex-1"
          }
        >
          {t("description")}
        </p>
      </div>
      <div
        className={
          "flex flex-col lg:flex-row items-stretch w-full justify-between gap-[20px]"
        }
      >
        {/*  FREE*/}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={
            "bg-neutral-100 flex-1 rounded-[30px] p-4 w-full flex flex-col justify-between gap-8"
          }
        >
          <div className={"flex flex-col gap-8"}>
            <div
              className={"bg-white rounded-[20px] p-8 flex flex-col gap-[50px]"}
            >
              <span
                className={
                  "text-black font-medium text-[1.5rem] leading-[20px]"
                }
              >
                {t("free.subtitle")}
              </span>
              <span
                className={
                  "text-black text-[2.5rem] lg:text-[5rem] leading-[100%] font-primary font-medium text-center"
                }
              >
                {t("free.title")}
              </span>
            </div>
            <ul
              className={
                "text-[1.4rem] lg:text-[1.6rem] text-black leading-[28px] lg:leading-[35.5px]"
              }
            >
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("free.list.1")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("free.list.2")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("free.list.3")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("free.list.4")}</span>
              </li>
              <li className={"flex items-center gap-6"}>
                <div className={"w-2 h-2 bg-black rounded-full"}></div>
                <span>{t("free.list.5")}</span>
              </li>
            </ul>
          </div>
          {/* <LinkBlack href={"#"}>{t("free.cta")}</LinkBlack> */}
        </motion.div>

        {/*  PRO*/}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={
            "bg-white flex-1 border-2 border-primary-500 rounded-[30px] p-4 w-full flex flex-col gap-8"
          }
        >
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
                {t("pro.tag")}
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
          {/* <LinkPrimary href={"#"}>{t("free.cta")}</LinkPrimary> */}
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
                <span
                  className={
                    "text-black font-medium text-[1.5rem] leading-[20px]"
                  }
                >
                  {t("entreprise.subtitle")}
                </span>
                <span
                  className={
                    "text-black text-[2.5rem] lg:text-[5rem] leading-[100%] font-primary font-medium text-center"
                  }
                >
                  {t("entreprise.title")}
                </span>
              </div>
              <ul
                className={
                  "text-[1.4rem] lg:text-[1.6rem] text-black leading-[28px] lg:leading-[35.5px]"
                }
              >
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("entreprise.list.1")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("entreprise.list.2")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("entreprise.list.3")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("entreprise.list.4")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("entreprise.list.5")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("entreprise.list.6")}</span>
                </li>
                <li className={"flex items-center gap-6"}>
                  <div className={"w-2 h-2 bg-black rounded-full"}></div>
                  <span>{t("entreprise.list.7")}</span>
                  <VerifiedOrganisationCheckMark />
                </li>
              </ul>
            </div>
            {/* <LinkBlack href={"#"}>{t("free.cta")}</LinkBlack> */}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Pricing;
